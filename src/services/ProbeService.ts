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
    const holeRadius = holeDiameter / 2;
    
    // For retracting to center of the hole after touching the wall
    const centerRetract = holeRadius - radius;
    const finalCenterRetract = centerRetract > 0 ? centerRetract : 1; // Fallback to avoid error
    
    // Direction multipliers based on corner finding
    // FL: +X, +Y to find inside the hole
    const xDir = (corner === 'front-left' || corner === 'back-left') ? 1 : -1;
    const yDir = (corner === 'front-left' || corner === 'front-right') ? 1 : -1;

    // Use holeDiameter for max travel during XY probe to avoid breaking bit
    const xyTravel = holeDiameter > 0 ? holeDiameter : maxTravel;

    const gcode = [
      'G91',
      // --- STEP 1: Z PROBE ---
      // Start position is directly over the hole.
      `G38.2 Z-${maxTravel} F${fastFeedrate}`,
      `G0 Z${retractDistance}`,
      `G38.2 Z-${retractDistance * 1.5} F${slowFeedrate}`,
      `G10 L20 P1 Z${zOffset}`,
      `G0 Z${retractDistance}`, // Retract slightly

      // --- STEP 2: PLUNGE INTO HOLE ---
      `G90`,
      // Plunge Z to below top surface (plate is zOffset thick)
      `G0 Z${Math.max(-maxTravel, zOffset - xyDropDistance)}`, // Prevent dropping dangerously deep
      `G91`,

      // --- STEP 3: X PROBE ---
      `G38.2 X${xDir * xyTravel} F${fastFeedrate}`,
      `G0 X${-xDir * retractDistance}`,
      `G38.2 X${xDir * retractDistance * 1.5} F${slowFeedrate}`,
      `G10 L20 P1 X${-xDir * (xWallThickness + radius)}`, 
      // Return to approximate hole center
      `G0 X${-xDir * finalCenterRetract}`,

      // --- STEP 4: Y PROBE ---
      `G38.2 Y${yDir * xyTravel} F${fastFeedrate}`,
      `G0 Y${-yDir * retractDistance}`,
      `G38.2 Y${yDir * retractDistance * 1.5} F${slowFeedrate}`,
      `G10 L20 P1 Y${-yDir * (yWallThickness + radius)}`,
      // Return to approximate hole center
      `G0 Y${-yDir * finalCenterRetract}`,
      
      // --- STEP 5: FINAL RETRACT & MOVE ---
      'G90',
      `G0 Z${safeHeight}`, // Pull out of the hole to safe height
      'G0 X0 Y0', // Move to the newly established material corner
    ];

    return {
      gcode,
      description: `3-Axis Corner Probe (${corner})`
    };
  }
};
