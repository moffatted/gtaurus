use std::collections::VecDeque;
use std::io::{BufRead, BufReader, Write};
use std::net::TcpStream;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use serialport::SerialPort;
use tauri::{AppHandle, Emitter};

/// Tauri event name for all lines received from the controller
pub const RX_EVENT: &str = "fluidnc://rx";

/// Safe Grbl/FluidNC serial receive buffer limit (hardware default is 128 bytes)
const MAX_BUFFER_SIZE: usize = 127;

// ─── SerialWrapper (Send-safe box) ───────────────────────────────────────────

pub struct SerialWrapper(pub Box<dyn SerialPort>);
unsafe impl Send for SerialWrapper {}

// ─── Connection status ────────────────────────────────────────────────────────

#[derive(Clone)]
pub enum ConnectionStatus {
    Disconnected,
    Serial(String), // port name
    Telnet(String), // host:port
}

impl std::fmt::Display for ConnectionStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            ConnectionStatus::Disconnected => write!(f, "Disconnected"),
            ConnectionStatus::Serial(p) => write!(f, "Serial: {p}"),
            ConnectionStatus::Telnet(h) => write!(f, "WiFi: {h}"),
        }
    }
}

// ─── Public trait ─────────────────────────────────────────────────────────────
#[cfg_attr(test, mockall::automock)]
pub trait GCodeConnection: Send {
    fn connect_serial(
        &mut self,
        port_name: &str,
        baud_rate: u32,
        handle: AppHandle,
    ) -> Result<(), String>;

    /// Connect via TCP telnet (FluidNC port 23)
    fn connect_telnet(&mut self, host: &str, port: u16, handle: AppHandle) -> Result<(), String>;

    fn send_command(&mut self, cmd: String) -> Result<(), String>;

    /// Send a real-time byte (0x3F '?', 0x21 '!', 0x7E '~', 0x18 …) bypassing the buffer
    fn send_realtime(&mut self, byte: u8) -> Result<(), String>;

    fn disconnect(&mut self);
    fn get_status(&self) -> String;
    fn add_rx_subscriber(&mut self, tx: std::sync::mpsc::Sender<String>);
}

// ─── Active connection container ──────────────────────────────────────────────

enum ActiveConnection {
    None,
    Serial {
        _port: SerialWrapper,
        rt_port: Arc<Mutex<Box<dyn SerialPort + Send>>>,
        cmd_tx: std::sync::mpsc::Sender<String>,
    },
    Telnet {
        _stream: TcpStream,               // kept alive
        rt_stream: Arc<Mutex<TcpStream>>, // realtime bypass write
        cmd_tx: std::sync::mpsc::Sender<String>,
    },
}

// ─── FluidNCDriver ────────────────────────────────────────────────────────────

pub struct FluidNCDriver {
    conn: ActiveConnection,
    status: ConnectionStatus,
    subscribers: Arc<Mutex<Vec<std::sync::mpsc::Sender<String>>>>,
}

impl FluidNCDriver {
    pub fn new() -> Self {
        Self {
            conn: ActiveConnection::None,
            status: ConnectionStatus::Disconnected,
            subscribers: Arc::new(Mutex::new(Vec::new())),
        }
    }

    fn emit(
        handle: &AppHandle,
        subs: &Arc<Mutex<Vec<std::sync::mpsc::Sender<String>>>>,
        line: &str,
    ) {
        let _ = handle.emit(RX_EVENT, line.to_string());
        if let Ok(mut subs_guard) = subs.lock() {
            subs_guard.retain(|tx| tx.send(line.to_string()).is_ok());
        }
    }

    // ── Serial helpers ─────────────────────────────────────────────────────

    fn spawn_serial_reader(
        reader_port: SerialWrapper,
        pending_bytes: Arc<Mutex<usize>>,
        pending_lens: Arc<Mutex<VecDeque<usize>>>,
        subscribers: Arc<Mutex<Vec<std::sync::mpsc::Sender<String>>>>,
        handle: AppHandle,
    ) {
        thread::spawn(move || {
            let mut reader = BufReader::new(reader_port.0);
            let mut line = String::new();
            loop {
                line.clear();
                match reader.read_line(&mut line) {
                    Ok(0) => {
                        Self::emit(&handle, &subscribers, "[GTaurus] Serial EOF");
                        break;
                    }
                    Ok(_) => {
                        let trimmed = line.trim().to_string();
                        if !trimmed.is_empty() {
                            if trimmed == "ok" {
                                let mut lenses = pending_lens.lock().unwrap();
                                if let Some(len) = lenses.pop_front() {
                                    let mut bytes = pending_bytes.lock().unwrap();
                                    *bytes = bytes.saturating_sub(len);
                                }
                            }
                            Self::emit(&handle, &subscribers, &trimmed);
                        }
                    }
                    Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => continue,
                    Err(_) => {
                        Self::emit(&handle, &subscribers, "[GTaurus] Serial read error");
                        break;
                    }
                }
            }
        });
    }

    fn spawn_serial_writer(
        mut writer_port: SerialWrapper,
        rx: std::sync::mpsc::Receiver<String>,
        pending_bytes: Arc<Mutex<usize>>,
        pending_lens: Arc<Mutex<VecDeque<usize>>>,
    ) {
        thread::spawn(move || {
            for cmd in rx {
                let cmd_len = cmd.len() + 1;
                loop {
                    if *pending_bytes.lock().unwrap() + cmd_len < MAX_BUFFER_SIZE {
                        break;
                    }
                    thread::sleep(Duration::from_millis(1));
                }
                let full_cmd = format!("{}\n", cmd);
                let _ = writer_port.0.write_all(full_cmd.as_bytes());
                let _ = writer_port.0.flush();
                {
                    let mut bytes = pending_bytes.lock().unwrap();
                    *bytes += cmd_len;
                    pending_lens.lock().unwrap().push_back(cmd_len);
                }
            }
        });
    }

    // ── Telnet (TCP) helpers ───────────────────────────────────────────────

    /// Spawns a reader thread on a cloned TcpStream.
    fn spawn_tcp_reader(
        stream: TcpStream,
        subscribers: Arc<Mutex<Vec<std::sync::mpsc::Sender<String>>>>,
        handle: AppHandle,
    ) {
        thread::spawn(move || {
            let mut reader = BufReader::new(stream);
            let mut line = String::new();
            loop {
                line.clear();
                match reader.read_line(&mut line) {
                    Ok(0) => {
                        Self::emit(&handle, &subscribers, "[GTaurus] Telnet connection closed");
                        break;
                    }
                    Ok(_) => {
                        let trimmed = line.trim().to_string();
                        if !trimmed.is_empty() {
                            Self::emit(&handle, &subscribers, &trimmed);
                        }
                    }
                    Err(ref e) if e.kind() == std::io::ErrorKind::TimedOut => continue,
                    Err(e) => {
                        Self::emit(
                            &handle,
                            &subscribers,
                            &format!("[GTaurus] Telnet read error: {e}"),
                        );
                        break;
                    }
                }
            }
        });
    }

    fn spawn_tcp_writer(stream: Arc<Mutex<TcpStream>>, rx: std::sync::mpsc::Receiver<String>) {
        thread::spawn(move || {
            for cmd in rx {
                let mut s = stream.lock().unwrap();
                let full_cmd = format!("{}\n", cmd);
                if s.write_all(full_cmd.as_bytes()).is_err() || s.flush().is_err() {
                    break;
                }
            }
        });
    }
}

// ─── GCodeConnection impl ────────────────────────────────────────────────────────

impl GCodeConnection for FluidNCDriver {
    fn connect_serial(
        &mut self,
        port_name: &str,
        baud_rate: u32,
        handle: AppHandle,
    ) -> Result<(), String> {
        self.disconnect();

        let port = serialport::new(port_name, baud_rate)
            .timeout(Duration::from_millis(100))
            .open()
            .map_err(|e| e.to_string())?;

        let reader_clone = SerialWrapper(port.try_clone().map_err(|e| e.to_string())?);
        let writer_clone = SerialWrapper(port.try_clone().map_err(|e| e.to_string())?);
        let rt_inner: Box<dyn SerialPort + Send> = port.try_clone().map_err(|e| e.to_string())?;
        let rt_port = Arc::new(Mutex::new(rt_inner));

        let (cmd_tx, cmd_rx) = std::sync::mpsc::channel::<String>();
        let pending_bytes = Arc::new(Mutex::new(0usize));
        let pending_lens = Arc::new(Mutex::new(VecDeque::<usize>::new()));

        Self::emit(
            &handle,
            &self.subscribers,
            &format!(
                "[GTaurus] Connected via Serial: {} @ {} baud",
                port_name, baud_rate
            ),
        );

        Self::spawn_serial_reader(
            reader_clone,
            pending_bytes.clone(),
            pending_lens.clone(),
            self.subscribers.clone(),
            handle,
        );
        Self::spawn_serial_writer(writer_clone, cmd_rx, pending_bytes, pending_lens);

        self.status = ConnectionStatus::Serial(port_name.to_string());
        self.conn = ActiveConnection::Serial {
            _port: SerialWrapper(port),
            rt_port,
            cmd_tx,
        };
        Ok(())
    }

    fn connect_telnet(&mut self, host: &str, port: u16, handle: AppHandle) -> Result<(), String> {
        self.disconnect();

        let addr = format!("{}:{}", host, port);
        let stream =
            TcpStream::connect(&addr).map_err(|e| format!("Cannot connect to {addr}: {e}"))?;

        // 100 ms read timeout so the reader thread doesn't block indefinitely
        stream
            .set_read_timeout(Some(Duration::from_millis(100)))
            .map_err(|e| e.to_string())?;

        let reader_clone = stream.try_clone().map_err(|e| e.to_string())?;
        let writer_arc = Arc::new(Mutex::new(stream.try_clone().map_err(|e| e.to_string())?));
        let rt_stream = writer_arc.clone();

        let (cmd_tx, cmd_rx) = std::sync::mpsc::channel::<String>();

        Self::emit(
            &handle,
            &self.subscribers,
            &format!("[GTaurus] Connected via Telnet (WiFi): {addr}"),
        );

        Self::spawn_tcp_reader(reader_clone, self.subscribers.clone(), handle);
        Self::spawn_tcp_writer(writer_arc, cmd_rx);

        self.status = ConnectionStatus::Telnet(addr);
        self.conn = ActiveConnection::Telnet {
            _stream: stream,
            rt_stream,
            cmd_tx,
        };
        Ok(())
    }

    fn send_command(&mut self, cmd: String) -> Result<(), String> {
        match &self.conn {
            ActiveConnection::Serial { cmd_tx, .. } => cmd_tx.send(cmd).map_err(|e| e.to_string()),
            ActiveConnection::Telnet { cmd_tx, .. } => cmd_tx.send(cmd).map_err(|e| e.to_string()),
            ActiveConnection::None => Err("Not connected".to_string()),
        }
    }

    fn send_realtime(&mut self, byte: u8) -> Result<(), String> {
        match &self.conn {
            ActiveConnection::Serial { rt_port, .. } => {
                let mut p = rt_port
                    .lock()
                    .map_err(|_| "Port lock poisoned".to_string())?;
                p.write_all(&[byte]).map_err(|e| e.to_string())?;
                p.flush().map_err(|e| e.to_string())
            }
            ActiveConnection::Telnet { rt_stream, .. } => {
                let mut s = rt_stream
                    .lock()
                    .map_err(|_| "Stream lock poisoned".to_string())?;
                s.write_all(&[byte]).map_err(|e| e.to_string())?;
                s.flush().map_err(|e| e.to_string())
            }
            ActiveConnection::None => Err("Not connected".to_string()),
        }
    }

    fn disconnect(&mut self) {
        self.conn = ActiveConnection::None;
        self.status = ConnectionStatus::Disconnected;
    }

    fn get_status(&self) -> String {
        self.status.to_string()
    }

    fn add_rx_subscriber(&mut self, tx: std::sync::mpsc::Sender<String>) {
        if let Ok(mut subs) = self.subscribers.lock() {
            subs.push(tx);
        }
    }
}
