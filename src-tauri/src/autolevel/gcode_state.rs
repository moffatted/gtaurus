use gcode::GCode;

#[derive(Debug, Clone, Default)]
pub struct GCodeState {
    pub x: f64,
    pub y: f64,
    pub z: f64,
    pub f: Option<f64>,
}

impl GCodeState {
    pub fn new() -> Self {
        Self {
            x: 0.0,
            y: 0.0,
            z: 0.0,
            f: None,
        }
    }

    /// Read arguments from a parsed G-code command and selectively update self.
    /// This is to support Modal state where "G1 X10" implies previous Y and previous Z.
    pub fn update_from_command(&mut self, command: &GCode) {
        if let Some(x) = command.value_for('X') {
            self.x = x as f64;
        }
        if let Some(y) = command.value_for('Y') {
            self.y = y as f64;
        }
        if let Some(z) = command.value_for('Z') {
            self.z = z as f64;
        }
        if let Some(f) = command.value_for('F') {
            self.f = Some(f as f64);
        }
    }

    /// Extracts target X,Y,Z from a command but falls back to current state if unspecified.
    pub fn get_target_coordinates(&self, command: &GCode) -> (f64, f64, f64) {
        let tx = command.value_for('X').map(|f| f as f64).unwrap_or(self.x);
        let ty = command.value_for('Y').map(|f| f as f64).unwrap_or(self.y);
        let tz = command.value_for('Z').map(|f| f as f64).unwrap_or(self.z);
        (tx, ty, tz)
    }
}
