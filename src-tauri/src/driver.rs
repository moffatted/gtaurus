/*
 * @file driver.rs
 * @purpose Tauri frontend driver wrapper that bridges the FluidNC driver events to the Tauri event system for the UI.
 */
use gtaurus_common::{
    DriverEventObserver, FluidNCDriver as LibDriver, RX_EVENT as COMMON_RX_EVENT,
};
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter};

/// Tauri event name for all lines received from the controller
pub const RX_EVENT: &str = COMMON_RX_EVENT;

pub struct FluidNCDriver {
    inner: LibDriver,
    app_handle_mutex: Arc<Mutex<Option<AppHandle>>>,
}

struct TauriObserver {
    handle: Arc<Mutex<Option<AppHandle>>>,
    subscribers: Arc<Mutex<Vec<std::sync::mpsc::Sender<String>>>>,
}

impl DriverEventObserver for TauriObserver {
    fn emit(&self, line: &str) {
        if let Ok(guard) = self.handle.lock() {
            if let Some(h) = guard.as_ref() {
                let _ = h.emit(RX_EVENT, line.to_string());
            }
        }
        if let Ok(mut subs_guard) = self.subscribers.lock() {
            subs_guard.retain(|tx| tx.send(line.to_string()).is_ok());
        }
    }
}

pub trait GCodeConnection: LibGCodeConnection + Send {
    fn connect_serial_tauri(
        &mut self,
        port_name: &str,
        baud_rate: u32,
        handle: AppHandle,
    ) -> Result<(), String>;

    fn connect_telnet_tauri(
        &mut self,
        host: &str,
        port: u16,
        handle: AppHandle,
    ) -> Result<(), String>;
}

// Re-export ConnectionStatus for visibility in this module's consumers
pub use gtaurus_common::GCodeConnection as LibGCodeConnection;

impl FluidNCDriver {
    pub fn new() -> Self {
        let app_handle_mutex = Arc::new(Mutex::new(None));

        // Initial observer (without knowing inner's subscribers yet)
        let observer = Arc::new(TauriObserver {
            handle: app_handle_mutex.clone(),
            subscribers: Arc::new(Mutex::new(Vec::new())),
        });

        let mut inner = LibDriver::new(observer);

        // Final observer that shares subscribers with inner
        let final_observer = Arc::new(TauriObserver {
            handle: app_handle_mutex.clone(),
            subscribers: inner.subscribers.clone(),
        });
        inner.observer = final_observer;

        Self {
            inner,
            app_handle_mutex,
        }
    }

    pub fn new_boxed() -> Box<dyn GCodeConnection> {
        Box::new(Self::new())
    }
}

impl GCodeConnection for FluidNCDriver {
    fn connect_serial_tauri(
        &mut self,
        port_name: &str,
        baud_rate: u32,
        handle: AppHandle,
    ) -> Result<(), String> {
        if let Ok(mut h) = self.app_handle_mutex.lock() {
            *h = Some(handle);
        }
        self.inner.connect_serial(port_name, baud_rate)
    }

    fn connect_telnet_tauri(
        &mut self,
        host: &str,
        port: u16,
        handle: AppHandle,
    ) -> Result<(), String> {
        if let Ok(mut h) = self.app_handle_mutex.lock() {
            *h = Some(handle);
        }
        self.inner.connect_telnet(host, port)
    }
}

// Forward other methods
impl LibGCodeConnection for FluidNCDriver {
    fn connect_serial(&mut self, port_name: &str, baud_rate: u32) -> Result<(), String> {
        self.inner.connect_serial(port_name, baud_rate)
    }

    fn connect_telnet(&mut self, host: &str, port: u16) -> Result<(), String> {
        self.inner.connect_telnet(host, port)
    }

    fn send_command(&mut self, cmd: String) -> Result<(), String> {
        self.inner.send_command(cmd)
    }

    fn send_realtime(&mut self, byte: u8) -> Result<(), String> {
        self.inner.send_realtime(byte)
    }

    fn disconnect(&mut self) {
        self.inner.disconnect()
    }

    fn get_status(&self) -> String {
        self.inner.get_status()
    }

    fn add_rx_subscriber(&mut self, tx: std::sync::mpsc::Sender<String>) {
        self.inner.add_rx_subscriber(tx)
    }

    fn set_auto_connect_suspended(&mut self, suspended: bool) {
        self.inner.set_auto_connect_suspended(suspended)
    }

    fn is_auto_connect_suspended(&self) -> bool {
        self.inner.is_auto_connect_suspended()
    }
}
