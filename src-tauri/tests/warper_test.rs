/*
 * @file warper_test.rs
 * @purpose Integration tests for the G-code warper, verifying path adjustments across surface variations.
 */
use gtaurus_lib::autolevel::height_map::HeightMap;
use gtaurus_lib::autolevel::warper::parse_and_warp;

#[test]
fn test_warper_integration() {
    let mut map = HeightMap::new(0.0, 0.0, 100.0, 2, 2);
    // Slope going up from 0 to 10 at y=100
    map.set_z_at_index(0, 1, 10.0);
    map.set_z_at_index(1, 1, 10.0);

    let gcode = "G1 X50 Y0 Z0\nG1 X50 Y100 Z0";
    let output = parse_and_warp(gcode, &map);
    
    // Check that we have multiple G1 moves in the output due to segmentation
    let lines: Vec<&str> = output.lines().collect();
    assert!(lines.len() > 2);
    
    // Check for a midpoint
    assert!(output.contains("Z5.000"));
}
