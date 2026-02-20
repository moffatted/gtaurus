use super::driver::{CNCController, ConnectionStatus, FluidNCDriver};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_connection_status_display() {
        let dc = ConnectionStatus::Disconnected;
        assert_eq!(dc.to_string(), "Disconnected");

        let ser = ConnectionStatus::Serial("COM3".to_string());
        assert_eq!(ser.to_string(), "Serial: COM3");

        let wifi = ConnectionStatus::Telnet("192.168.1.10:23".to_string());
        assert_eq!(wifi.to_string(), "WiFi: 192.168.1.10:23");
    }

    #[test]
    fn test_driver_initial_state() {
        let driver = FluidNCDriver::new();
        assert_eq!(driver.get_status(), "Disconnected");
    }
}
