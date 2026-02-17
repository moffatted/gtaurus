use serialport::SerialPort;
use std::collections::VecDeque;
use std::io::{self, BufRead, BufReader, Write};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

pub struct SerialWrapper(pub Box<dyn SerialPort>);
unsafe impl Send for SerialWrapper {}

const MAX_BUFFER_SIZE: usize = 127; // Safe limit for GRBL/FluidNC (usually 128-254)

pub trait CNCController {
    fn connect(&mut self, port_name: &str, baud_rate: u32) -> Result<(), String>;
    fn send_command(&mut self, cmd: String) -> Result<(), String>;
    fn send_realtime_command(&mut self, cmd: char) -> Result<(), String>;
    fn stream_file(&mut self, path: String) -> Result<(), String>;
    fn get_status(&self) -> String;
}

pub struct FluidNCDriver {
    port: Option<SerialWrapper>,
    sender: Option<std::sync::mpsc::Sender<String>>,
    status: Arc<Mutex<String>>,
}

impl FluidNCDriver {
    pub fn new() -> Self {
        Self {
            port: None,
            sender: None,
            status: Arc::new(Mutex::new("Disconnected".to_string())),
        }
    }
}

impl CNCController for FluidNCDriver {
    fn connect(&mut self, port_name: &str, baud_rate: u32) -> Result<(), String> {
        let port = serialport::new(port_name, baud_rate)
            .timeout(Duration::from_millis(100))
            .open()
            .map_err(|e| e.to_string())?;

        // Clone for reading
        let reader_port = SerialWrapper(port.try_clone().map_err(|e| e.to_string())?);
        let mut writer_port = SerialWrapper(port.try_clone().map_err(|e| e.to_string())?);

        // Channel for sending commands to the writer thread
        let (tx, rx) = std::sync::mpsc::channel::<String>();
        self.sender = Some(tx);

        // Shared state for buffer management
        let pending_bytes = Arc::new(Mutex::new(0usize));
        let pending_lens = Arc::new(Mutex::new(VecDeque::<usize>::new()));

        let p_bytes_read = pending_bytes.clone();
        let p_lens_read = pending_lens.clone();

        // status update
        *self.status.lock().unwrap() = "Connected".to_string();

        // READER THREAD
        // Listens for 'ok' and updates buffer counts
        thread::spawn(move || {
            let mut reader = BufReader::new(reader_port.0);
            let mut line = String::new();
            loop {
                line.clear();
                match reader.read_line(&mut line) {
                    Ok(0) => break, // EOF
                    Ok(_) => {
                        let trimmed = line.trim();
                        if trimmed == "ok" {
                            let mut lenses = p_lens_read.lock().unwrap();
                            if let Some(len) = lenses.pop_front() {
                                let mut bytes = p_bytes_read.lock().unwrap();
                                *bytes = bytes.saturating_sub(len);
                            }
                        }
                        // TODO: Parse other messages (ALARM, status reports <...>)
                        print!("RX: {}", line);
                    }
                    Err(ref e) if e.kind() == io::ErrorKind::TimedOut => continue,
                    Err(_) => break,
                }
            }
        });

        // WRITER THREAD (Character Counting Protocol)
        thread::spawn(move || {
            for cmd in rx {
                let cmd_len = cmd.len() + 1; // +1 for \n

                // Wait for buffer space
                loop {
                    let current_bytes = *pending_bytes.lock().unwrap();
                    if current_bytes + cmd_len < MAX_BUFFER_SIZE {
                        break;
                    }
                    thread::sleep(Duration::from_millis(1));
                }

                // Send
                let _ = writeln!(writer_port.0, "{}", cmd);
                let _ = writer_port.0.flush();

                // Update tracking
                {
                    let mut bytes = pending_bytes.lock().unwrap();
                    *bytes += cmd_len;
                    let mut lenses = pending_lens.lock().unwrap();
                    lenses.push_back(cmd_len);
                }
            }
        });

        self.port = Some(SerialWrapper(port));
        Ok(())
    }

    fn send_command(&mut self, cmd: String) -> Result<(), String> {
        if let Some(tx) = &self.sender {
            tx.send(cmd).map_err(|e| e.to_string())?;
            Ok(())
        } else {
            Err("Not connected".to_string())
        }
    }

    fn send_realtime_command(&mut self, cmd: char) -> Result<(), String> {
        if let Some(wrapper) = &mut self.port {
            wrapper
                .0
                .write_all(&[cmd as u8])
                .map_err(|e| e.to_string())?;
            wrapper.0.flush().map_err(|e| e.to_string())?;
            Ok(())
        } else {
            Err("Not connected".to_string())
        }
    }

    fn stream_file(&mut self, path: String) -> Result<(), String> {
        let tx = self.sender.as_ref().ok_or("Not connected")?.clone();

        // Spawn a thread to read file and send lines to the writer channel
        // This avoids blocking the main thread while reading a potentially large file
        thread::spawn(move || {
            if let Ok(file) = std::fs::File::open(path) {
                let reader = BufReader::new(file);
                for line in reader.lines() {
                    if let Ok(l) = line {
                        let trimmed = l.trim();
                        if !trimmed.is_empty() {
                            let _ = tx.send(trimmed.to_string());
                            // Small delay to prevent flooding channel if it was unbounded (though mpsc is unbounded by default)
                            // For better flow control, we should use a bounded channel, but for now this is okay.
                        }
                    }
                }
            }
        });

        Ok(())
    }

    fn get_status(&self) -> String {
        self.status.lock().unwrap().clone()
    }
}
