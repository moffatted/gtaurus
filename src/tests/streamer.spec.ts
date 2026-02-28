/**
 * @file streamer.spec.ts
 * @purpose Quality assurance for the G-code streaming engine, testing character counting and serial buffer management.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { GCodeStreamer } from '../utils/streamer';

describe('GCodeStreamer (Character Counting)', () => {
  let streamer: GCodeStreamer;

  beforeEach(() => {
    streamer = new GCodeStreamer();
  });

  it('should ignore empty lines and comments', () => {
    streamer.loadGcode(['G1 X10', '', '; This is a comment', 'G1 Y20']);
    expect(streamer.totalLines).toBe(2);
  });

  it('should process lines up to 127 bytes', async () => {
    let sentCount = 0;
    streamer.onSend = async () => { sentCount++ };

    const longLine = "G1 X100.000 Y100.000 Z100.000 F2000.000 S1000"; // 45 chars
    // Add 45 + 1 = 46 bytes each.
    // 46 * 3 = 138 (exceeds 127) -> Only 2 should send immediately.

    streamer.loadGcode([longLine, longLine, longLine]);
    streamer.start(); // Processes queue automatically
    
    // Wait for the async loop to flush
    await new Promise(r => setTimeout(r, 0));

    expect(sentCount).toBe(2);
    expect(streamer.getPendingCount()).toBe(2);
    expect(streamer.getBufferFill()).toBe(92);
  });

  it('should resume sending when "ok" clears space', async () => {
    let sentCount = 0;
    streamer.onSend = async () => { sentCount++ };

    const longLine = "G1 X100.000 Y100.000 Z100.000 F2000.000 S1000"; // 46 bytes

    streamer.loadGcode([longLine, longLine, longLine]);
    streamer.start();

    await new Promise(r => setTimeout(r, 0));

    // Sends 2 lines immediately, 92 bytes full
    expect(sentCount).toBe(2);
    expect(streamer.getBufferFill()).toBe(92);

    // One hardware 'ok' arrives
    streamer.onOkReceived();
    await new Promise(r => setTimeout(r, 0));

    // Now space is 92 - 46 = 46. Next line (46) can fit. (46 + 46 = 92)
    expect(sentCount).toBe(3);
    // Note: getPendingCount represents lines sent but NOT YET acked
    expect(streamer.getPendingCount()).toBe(2); 
    expect(streamer.getBufferFill()).toBe(92);
  });

  it('should keep track of acknowledged lines for resume capabilities', async () => {
    let ackedReceived = 0;
    streamer.onSend = async () => {};
    streamer.onAck = (lineNum) => { ackedReceived = lineNum };

    streamer.loadGcode(['G21', 'G90', 'G0 X0 Y0']);
    streamer.start();

    await new Promise(r => setTimeout(r, 0));

    expect(streamer.sentLines).toBe(3);
    
    streamer.onOkReceived(); // Ack 1
    expect(streamer.ackedLines).toBe(1);
    expect(ackedReceived).toBe(1);

    streamer.onOkReceived(); // Ack 2
    expect(streamer.ackedLines).toBe(2);
    expect(ackedReceived).toBe(2);
  });

  it('can pause and resume without losing lines', async () => {
    let sentCount = 0;
    streamer.onSend = async () => { sentCount++ };

    streamer.loadGcode(['M3 S1000', 'G1 X10', 'G1 Y10', 'M5']);
    
    // Start it paused (manually triggering addToQueue wouldn't start)
    // Actually, loadGcode doesn't auto-start. If we pause(), then try to addToQueue,
    // it shouldn't process.
    streamer.pause();
    streamer.addToQueue('G1 X20'); // Adds but shouldn't process

    await new Promise(r => setTimeout(r, 0));
    expect(sentCount).toBe(0);

    streamer.resume();
    await new Promise(r => setTimeout(r, 0));
    // 4 small lines + 1 manually added line fit easily in 127 bytes
    expect(sentCount).toBe(5);
  });

});
