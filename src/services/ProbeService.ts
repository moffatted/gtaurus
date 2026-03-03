/**
 * @file ProbeService.ts
 * @purpose Logic for generating G-code sequences for various machine probing and calibration routines.
 */
import { ProbeSettings } from '../stores/settingsStore';

export type ProbeCorner = 'front-left' | 'front-right' | 'back-left' | 'back-right';

export interface ProbeResult {
  gcode: string[];
  description: string;
}

/**
 * Service to generate G-code sequences for Basic Probing.
 * Respects global probe settings for feedrates, retracts, and offsets.
 */
export const ProbeService = {
  /**
   * Generates a simple Z-axis probe sequence.
   */
  generateZProbe(settings: ProbeSettings, maxTravel?: number): ProbeResult {
    const { fastFeedrate, slowFeedrate, retractDistance, zOffset } = settings;
    const travel = maxTravel ?? settings.maxTravel;
    
    const gcode = [
      'G91', // Incremental mode
      `G38.2 Z-${travel} F${fastFeedrate}`, // Fast probe
      `G0 Z${retractDistance}`, // Retract
      `G38.2 Z-${retractDistance * 1.5} F${slowFeedrate}`, // Slow precise probe
      `G10 L20 P1 Z${zOffset}`, // Set current Z as plate thickness
      `G0 Z${retractDistance * 2}`, // Final retract to clear plate
      'G90' // Back to absolute mode
    ];

    return {
      gcode,
      description: 'Z-Axis Touch Plate Calibration'
    };
  },

  /**
   * Generates a 3-axis corner probe sequence.
   */
  generateCornerProbe(
    settings: ProbeSettings, 
    corner: ProbeCorner,
    safeHeight: number = 10
  ): ProbeResult {
    const { 
      fastFeedrate, 
      slowFeedrate, 
      retractDistance, 
      maxTravel,
      stylusDiameter,
      zOffset,
      xWallThickness = 2.63,
      yWallThickness = 2.63,
      holeDiameter = 0,
      xyDropDistance = 3
    } = settings;

    const radius = stylusDiameter / 2;
    // How far into the plate from the corner to ensure hitting solid material.
    // Clears the relief hole plus 5mm buffer.
    const moveOver = holeDiameter > 0 ? (holeDiameter / 2) + 5 : 12;
    const clearanceXY = 5;
    const clearanceZ = 5;
    
    // Direction multipliers based on corner finding
    // FL: +X, +Y to find inside the hole
    const xDir = (corner === 'front-left' || corner === 'back-left') ? 1 : -1;
    const yDir = (corner === 'front-left' || corner === 'front-right') ? 1 : -1;

    // VERY IMPORTANT: Calculate a safe plunge depth to prevent crashing into the bed!
    // xyDropDistance is how far BELOW the top of the plate we drop for X/Y probing.
    // If xyDropDistance is greater than the plate thickness (zOffset), it will crash into the workpiece.
    // Ensure we keep at least 0.5mm clearance above the workpiece bottom to be safe.
    const safeDropDistance = Math.min(xyDropDistance, Math.max(0.1, zOffset - 0.5));

    const traverseFeed = fastFeedrate * 2; // Controlled brisk speed for repositioning

    const gcode = [
      'G91',
      
      // --- STEP 1: Z PROBE ---
      // Start position is slightly inside the hole.
      `G1 Z10 F${traverseFeed}`, // 1. Raise Z 10mm relative to ensure bit clears the hole safely
      `G1 X${xDir * moveOver} Y${yDir * moveOver} F${traverseFeed}`, // 2. Move diagonally over the solid plate
      `G38.2 Z-${10 + maxTravel} F${fastFeedrate}`, // 3. Fast probe down onto plate
      `G1 Z${retractDistance} F${traverseFeed}`, // Retract
      `G38.2 Z-${retractDistance * 1.5} F${slowFeedrate}`, // 4. Slow precise probe
      `G10 L20 P1 Z${zOffset}`, // Set Z = plate thickness
      `G1 Z${clearanceZ} F${traverseFeed}`, // 5. Raise to safe Z clearance height above the actual plate
      
      // --- STEP 2: X EDGE PROBE ---
      `G1 X${-xDir * moveOver} Y${-yDir * moveOver} F${traverseFeed}`, // 6. Return back over the hole as a central waypoint
      `G1 X${-xDir * (xWallThickness + radius + clearanceXY)} Y${yDir * moveOver} F${traverseFeed}`, // 7. Move out past X edge, but securely onto Y solid edge
      `G1 Z-${clearanceZ + safeDropDistance} F${fastFeedrate}`, // 8. Lower Z completely past the top surface of the plate (safe max depth constraint applied)
      `G38.2 X${xDir * maxTravel} F${fastFeedrate}`, // 9. Probe X in towards the plate
      `G1 X${-xDir * retractDistance} F${traverseFeed}`,
      `G38.2 X${xDir * retractDistance * 1.5} F${slowFeedrate}`,
      `G10 L20 P1 X${-xDir * (xWallThickness + radius)}`, // Set X established origin offset
      `G1 X${-xDir * clearanceXY} F${traverseFeed}`, // Move back slightly from the edge
      `G1 Z${clearanceZ + safeDropDistance} F${traverseFeed}`, // Raise Z back up to safe clearance altitude
      
      // --- STEP 3: Y EDGE PROBE ---
      // 10. Move directly from outside X edge over to outside Y edge
      `G1 X${xDir * (moveOver + xWallThickness + radius + clearanceXY)} Y${-yDir * (moveOver + yWallThickness + radius + clearanceXY)} F${traverseFeed}`,
      `G1 Z-${clearanceZ + safeDropDistance} F${fastFeedrate}`, // 11. Lower Z entirely below the top surface of plate (safe max depth constraint applied)
      `G38.2 Y${yDir * maxTravel} F${fastFeedrate}`, // 12. Probe Y in towards the plate
      `G1 Y${-yDir * retractDistance} F${traverseFeed}`,
      `G38.2 Y${yDir * retractDistance * 1.5} F${slowFeedrate}`,
      `G10 L20 P1 Y${-yDir * (yWallThickness + radius)}`, // Set Y established origin offset
      `G1 Y${-yDir * clearanceXY} F${traverseFeed}`, // Move back slightly from the edge
      `G1 Z${clearanceZ + safeDropDistance} F${traverseFeed}`, // Raise Z back up to safe clearance altitude
      
      // --- STEP 4: FINAL RETRACT & RETURN ---
      'G90', // Back to absolute positioning system
      `G0 Z${safeHeight}`, // Pull spindle all the way up to user's absolute safe travel height (anchored to Z=0)
      'G0 X0 Y0', // Rapid travel precisely to the newly established stock piece corner!
    ];

    return {
      gcode,
      description: `3-Axis Corner Probe (${corner})`
    };
  }
};
