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
}

export const parseStatusReport = (raw: string): Partial<ControllerStatus> => {
  // Example: <Idle|MPos:0.000,0.000,0.000|Bf:15,128|FS:0,0|WCO:0.000,0.000,0.000>
  const status: Partial<ControllerStatus> = {};

  // 1. Extract Machine State (Idle, Run, Hold, Alarm, etc.)
  const stateMatch = raw.match(/^<(\w+)/);
  if (stateMatch) status.state = stateMatch[1];

  // 2. Extract MPos (Machine Position)
  const mposMatch = raw.match(/MPos:([-+0-9.]+),([-+0-9.]+),([-+0-9.]+)/);
  if (mposMatch) {
    status.mpos = {
      x: parseFloat(mposMatch[1]),
      y: parseFloat(mposMatch[2]),
      z: parseFloat(mposMatch[3]),
    };
  }

  // WCO
  const wcoMatch = raw.match(/WCO:([-+0-9.]+),([-+0-9.]+),([-+0-9.]+)/);
  if (wcoMatch) {
    status.wco = {
      x: parseFloat(wcoMatch[1]),
      y: parseFloat(wcoMatch[2]),
      z: parseFloat(wcoMatch[3]),
    };
  }

  // 3. Extract Bf (Buffer state - Critical for MKS DLC32)
  // 15 = blocks available in planner, 128 = bytes available in serial RX
  const bufferMatch = raw.match(/Bf:(\d+),(\d+)/);
  if (bufferMatch) {
    status.buffer = {
      planned: parseInt(bufferMatch[1], 10),
      serial: parseInt(bufferMatch[2], 10),
    };
  }

  // 4. Extract FS (Feed and Spindle Speed)
  const fsMatch = raw.match(/FS:(\d+),(\d+)/);
  if (fsMatch) {
    status.feedrate = parseInt(fsMatch[1], 10);
    status.spindle = parseInt(fsMatch[2], 10);
  }

  // 5. Pins 
  const pinsMatch = raw.match(/Pn:([XYZPDHRS]+)/);
  if (pinsMatch) {
    status.pins = pinsMatch[1];
  }

  return status;
};
