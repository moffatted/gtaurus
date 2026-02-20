use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HeightMap {
    pub min_x: f64,
    pub min_y: f64,
    pub spacing: f64,
    pub cols: usize,
    pub rows: usize,
    pub grid: Vec<f64>, // Probed Z values
}

impl HeightMap {
    pub fn new(min_x: f64, min_y: f64, spacing: f64, cols: usize, rows: usize) -> Self {
        Self {
            min_x,
            min_y,
            spacing,
            cols,
            rows,
            grid: vec![0.0; cols * rows],
        }
    }

    pub fn set_z_at_index(&mut self, col: usize, row: usize, z: f64) {
        if col < self.cols && row < self.rows {
            self.grid[row * self.cols + col] = z;
        }
    }

    /// Retrieve the Z coordinate array index for physical X/Y location
    pub fn get_index_for_position(&self, x: f64, y: f64) -> Option<(usize, usize)> {
        if x < self.min_x || y < self.min_y {
            return None;
        }

        let col = ((x - self.min_x) / self.spacing).round() as usize;
        let row = ((y - self.min_y) / self.spacing).round() as usize;

        if col < self.cols && row < self.rows {
            Some((col, row))
        } else {
            None
        }
    }

    /// Perform Bilinear Interpolation to find the height offset for any physical X/Y
    pub fn get_z_offset(&self, x: f64, y: f64) -> f64 {
        // If we don't have enough data or points are outside map bounds,
        // fallback to 0.0 offset or nearest clamped value.
        if self.cols < 2 || self.rows < 2 {
            return 0.0;
        }

        let gx = ((x - self.min_x) / self.spacing).clamp(0.0, (self.cols - 1) as f64);
        let gy = ((y - self.min_y) / self.spacing).clamp(0.0, (self.rows - 1) as f64);

        let ix = gx.floor() as usize;
        let iy = gy.floor() as usize;

        // Ensure we don't index out of bounds at the very edges
        let ix1 = (ix + 1).min(self.cols - 1);
        let iy1 = (iy + 1).min(self.rows - 1);

        let tx = gx - ix as f64;
        let ty = gy - iy as f64;

        let z00 = self.grid[iy * self.cols + ix];
        let z10 = self.grid[iy * self.cols + ix1];
        let z01 = self.grid[iy1 * self.cols + ix];
        let z11 = self.grid[iy1 * self.cols + ix1];

        // Bilinear Interpolation Formula
        (1.0 - tx) * (1.0 - ty) * z00
            + tx * (1.0 - ty) * z10
            + (1.0 - tx) * ty * z01
            + tx * ty * z11
    }
}

// Write some simple tests for mathematical correctness
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_interpolation_warp() {
        // 100x100mm square height map starting at 0,0
        // Bottom-left is 0.0, Top-right is 10.0
        let map = HeightMap {
            min_x: 0.0,
            min_y: 0.0,
            spacing: 100.0,
            cols: 2,
            rows: 2,
            grid: vec![
                0.0, 0.0, // y=0 line
                10.0, 10.0, // y=100 line
            ],
        };

        // Center point at y=50 should be halfway up the incline: 5.0
        assert_eq!(map.get_z_offset(50.0, 50.0), 5.0);

        // Edge points
        assert_eq!(map.get_z_offset(0.0, 0.0), 0.0);
        assert_eq!(map.get_z_offset(100.0, 100.0), 10.0);
        assert_eq!(map.get_z_offset(50.0, 100.0), 10.0);
    }
}
