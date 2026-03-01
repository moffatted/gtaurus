/**
 * @file parser.ts
 * @purpose Specialized regex-based parser for decoding real-time machine status reports (GRBL/FluidNC).
 */
export interface ControllerStatus {
  state: string;
  mpos: { x: number; y: number; z: number };
  wco: { x: number; y: number; z: number };
  buffer: { planned: number; serial: number };
  feedrate: number;
  spindle: number;
  pins: string;
  units: 'mm' | 'in';
}

/**
 * Parses a standard GRBL/FluidNC status report line.
 * Example: <Idle|MPos:0.000,0.000,0.000|Bf:15,128|FS:0,0|WCO:0.000,0.000,0.000|Pn:P|Ov:100,100,100>
 */
export const parseStatusReport = (raw: string): Partial<ControllerStatus> => {
  const status: Partial<ControllerStatus> = {};
  if (!raw.startsWith('<') || !raw.endsWith('>')) return status;

  const content = raw.slice(1, -1);
  const parts = content.split('|');

  // 1. Machine State
  status.state = parts[0];

  // 2. Extract Key-Value Pairs
  const mposMatch = raw.match(/MPos:([-+0-9.]+),([-+0-9.]+),([-+0-9.]+)/i);
  const wposMatch = raw.match(/WPos:([-+0-9.]+),([-+0-9.]+),([-+0-9.]+)/i);
  const wcoMatch = raw.match(/WCO:([-+0-9.]+),([-+0-9.]+),([-+0-9.]+)/i);
  const fsMatch = raw.match(/FS:(\d+),(\d+)/i);
  const sMatch = raw.match(/S:(\d+)/i);
  const bfMatch = raw.match(/Bf:(\d+),(\d+)/i);
  const pinsMatch = raw.match(/Pn:([XYZPDHRS]+)/i);

  // Detect Units (Case-insensitive)
  const isInch = /\|in/i.test(raw);
  status.units = isInch ? 'in' : 'mm';
  const scale = isInch ? 25.4 : 1.0;

  // Store WCO if present (normalized to mm)
  if (wcoMatch) {
    status.wco = {
      x: parseFloat(wcoMatch[1]) * scale,
      y: parseFloat(wcoMatch[2]) * scale,
      z: parseFloat(wcoMatch[3]) * scale,
    };
  }

  // Handle MPos vs WPos (Normalize to MPos in the store)
  if (mposMatch) {
    status.mpos = {
      x: parseFloat(mposMatch[1]) * scale,
      y: parseFloat(mposMatch[2]) * scale,
      z: parseFloat(mposMatch[3]) * scale,
    };
  } else if (wposMatch && status.wco) {
    // If reporting WPos, MPos = WPos + WCO
    status.mpos = {
      x: (parseFloat(wposMatch[1]) * scale) + status.wco.x,
      y: (parseFloat(wposMatch[2]) * scale) + status.wco.y,
      z: (parseFloat(wposMatch[3]) * scale) + status.wco.z,
    };
  }

  if (fsMatch) {
    status.feedrate = parseInt(fsMatch[1], 10);
    status.spindle = parseInt(fsMatch[2], 10);
  } else if (sMatch) {
    status.spindle = parseInt(sMatch[1], 10);
  }

  if (bfMatch) {
    status.buffer = { planned: parseInt(bfMatch[1], 10), serial: parseInt(bfMatch[2], 10) };
  }

  if (pinsMatch) status.pins = pinsMatch[1];

  return status;
};
