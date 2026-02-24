use futures_util::{SinkExt, StreamExt};
use serde_json::Value;
use tauri::{AppHandle, Manager};
use tokio::net::TcpListener;
use tokio_tungstenite::accept_async;
use tungstenite::Message;

use crate::AppState;

pub fn start_server(app_handle: AppHandle) {
    tauri::async_runtime::spawn(async move {
        // Start TCP listener
        let addr = "0.0.0.0:9001";
        let listener = match TcpListener::bind(&addr).await {
            Ok(l) => l,
            Err(e) => {
                eprintln!("[WS] Failed to bind to {}: {}", addr, e);
                return;
            }
        };
        println!("[WS] Server listening on ws://{}", addr);

        while let Ok((stream, _)) = listener.accept().await {
            let handle_clone = app_handle.clone();
            tauri::async_runtime::spawn(async move {
                let ws_stream = match accept_async(stream).await {
                    Ok(ws) => ws,
                    Err(e) => {
                        eprintln!("[WS] Handshake failed: {}", e);
                        return;
                    }
                };

                println!("[WS] New client connected");
                let (mut ws_tx, mut ws_rx) = ws_stream.split();

                // To send events to this client, we create an mpsc channel
                let (event_tx, mut event_rx) = tokio::sync::mpsc::channel::<Value>(32);

                // We need to subscribe to FluidNCDriver events.
                // The driver has `add_rx_subscriber`.
                let (driver_rx_tx, driver_rx_rx) = std::sync::mpsc::channel::<String>();
                {
                    let state = handle_clone.state::<AppState>();
                    if let Ok(mut lock) = state.driver.lock() {
                        lock.add_rx_subscriber(driver_rx_tx);
                    };
                }

                // Spawn a task to forward driver events to WS client
                let event_tx_clone = event_tx.clone();
                let _driver_forward_task = tokio::task::spawn_blocking(move || {
                    while let Ok(line) = driver_rx_rx.recv() {
                        let _ = event_tx_clone.blocking_send(serde_json::json!({
                            "type": "event",
                            "event": "fluidnc://rx",
                            "payload": line
                        }));
                    }
                });

                // Spawn a task to forward autolevel events
                // Wait: Currently we only really need fluidnc://rx for basic control,
                // but for full capability we might need more. We'll stick to fluidnc://rx for now.

                // Task to write to websocket
                let mut write_task = tauri::async_runtime::spawn(async move {
                    while let Some(msg) = event_rx.recv().await {
                        if ws_tx
                            .send(Message::Text(msg.to_string().into()))
                            .await
                            .is_err()
                        {
                            break;
                        }
                    }
                });

                // Task to read from websocket
                let read_handle = handle_clone.clone();
                let mut read_task = tauri::async_runtime::spawn(async move {
                    while let Some(msg) = ws_rx.next().await {
                        if let Ok(Message::Text(txt)) = msg {
                            if let Ok(req) = serde_json::from_str::<Value>(&txt) {
                                if req["type"] == "invoke" {
                                    let id = req["id"].as_str().unwrap_or("").to_string();
                                    let cmd = req["cmd"].as_str().unwrap_or("");
                                    let args = req["args"].clone();

                                    let response = handle_invoke(&read_handle, cmd, args).await;

                                    let resp_msg = match response {
                                        Ok(payload) => serde_json::json!({
                                            "type": "response",
                                            "id": id,
                                            "payload": payload
                                        }),
                                        Err(err) => serde_json::json!({
                                            "type": "response",
                                            "id": id,
                                            "error": err
                                        }),
                                    };
                                    let _ = event_tx.send(resp_msg).await;
                                }
                            }
                        }
                    }
                });

                tokio::select! {
                    _ = &mut write_task => {},
                    _ = &mut read_task => {},
                };

                println!("[WS] Client disconnected");
            });
        }
    });
}

// Map the commands
async fn handle_invoke(app: &AppHandle, cmd: &str, args: Value) -> Result<Value, String> {
    let state = app.state::<AppState>();

    match cmd {
        "list_serial_ports" => {
            let ports = crate::shared_list_serial_ports();
            Ok(serde_json::to_value(ports).unwrap())
        }
        "get_connection_status" => {
            let driver = state.driver.lock().map_err(|_| "Lock failed")?;
            Ok(serde_json::Value::String(driver.get_status().to_string()))
        }
        "send_gcode" => {
            let code = args["cmd"].as_str().unwrap_or("");
            let mut driver = state.driver.lock().map_err(|_| "Lock failed")?;
            driver.send_command(code.to_string())?;
            Ok(serde_json::Value::Null)
        }
        "send_realtime" => {
            let byte_num = args["byte"].as_u64().unwrap_or(0) as u8;
            let mut driver = state.driver.lock().map_err(|_| "Lock failed")?;
            driver.send_realtime(byte_num)?;
            Ok(serde_json::Value::Null)
        }
        "connect_serial" => {
            let port = args["port_name"].as_str().unwrap_or("");
            let baud = args["baud_rate"].as_u64().unwrap_or(115200) as u32;
            let mut driver = state.driver.lock().map_err(|_| "Lock failed")?;
            driver.connect_serial(port, baud, app.clone())?;
            Ok(serde_json::Value::String(format!("Connected to {}", port)))
        }
        "connect_telnet" => {
            let host = args["host"].as_str().unwrap_or("");
            let port = args["ws_port"].as_u64().map(|p| p as u16).unwrap_or(23);
            let mut driver = state.driver.lock().map_err(|_| "Lock failed")?;
            driver.connect_telnet(host, port, app.clone())?;
            Ok(serde_json::Value::String(format!(
                "Connected to {}:{}",
                host, port
            )))
        }
        "disconnect" => {
            let mut driver = state.driver.lock().map_err(|_| "Lock failed")?;
            driver.disconnect();
            Ok(serde_json::Value::Null)
        }
        "stream_local_gcode" => {
            // Note: streaming from web usually requires uploading the file content,
            // but if the backend already has it via filepath, we can use the existing logic.
            // Wait, Web won't have local paths. If the user invokes stream_local_gcode from Web,
            // it will fail unless the file is on the server.
            // For now, we only implement this for the unified API.
            let path = args["path"].as_str().unwrap_or("").to_string();
            crate::shared_stream_local_gcode(&*state, path).map(|s| serde_json::Value::String(s))
        }
        _ => Err(format!(
            "Command {} not implemented in WebSocket bridge",
            cmd
        )),
    }
}
