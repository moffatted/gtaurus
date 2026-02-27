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
      zOffset 
    } = settings;

    const radius = stylusDiameter / 2;
    
    // Direction multipliers based on corner
    const xDir = (corner === 'front-left' || corner === 'back-left') ? 1 : -1;
    const yDir = (corner === 'front-left' || corner === 'front-right') ? 1 : -1;

    const clearOffset = 15; // Distance to move past the edge for side probing
    const edgeDepth = 5; // Depth to lower for side contact

    const gcode = [
      'G91',
      // --- STEP 1: Z PROBE ---
      `G38.2 Z-${maxTravel} F${fastFeedrate}`,
      `G0 Z${retractDistance}`,
      `G38.2 Z-${retractDistance * 1.5} F${slowFeedrate}`,
      `G10 L20 P1 Z${zOffset}`,
      `G0 Z${safeHeight}`, // Clear plate

      // --- STEP 2: X PROBE ---
      `G0 X${-xDir * clearOffset}`, 
      `G0 Z-${safeHeight + edgeDepth}`, 
      `G38.2 X${xDir * clearOffset * 1.5} F${fastFeedrate}`,
      `G0 X${-xDir * retractDistance}`,
      `G38.2 X${xDir * retractDistance * 1.5} F${slowFeedrate}`,
      `G10 L20 P1 X${-xDir * radius}`, 
      `G0 X${-xDir * retractDistance * 2}`,
      `G0 Z${safeHeight + edgeDepth}`,

      // --- STEP 3: Y PROBE ---
      `G90`, `G0 X0`, `G91`, // Back to X-center
      `G0 Y${-yDir * clearOffset}`,
      `G0 Z-${safeHeight + edgeDepth}`,
      `G38.2 Y${yDir * clearOffset * 1.5} F${fastFeedrate}`,
      `G0 Y${-yDir * retractDistance}`,
      `G38.2 Y${yDir * retractDistance * 1.5} F${slowFeedrate}`,
      `G10 L20 P1 Y${-yDir * radius}`,
      `G0 Y${-yDir * retractDistance * 2}`,
      `G0 Z${safeHeight + edgeDepth}`,
      
      'G90',
      'G0 X0 Y0', // Move to the newly established corner zero
      `G0 Z${safeHeight * 2}` // Final safe height
    ];

    return {
      gcode,
      description: `3-Axis Corner Probe (${corner})`
    };
  }
};
