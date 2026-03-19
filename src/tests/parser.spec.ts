/**
 * @file parser.spec.ts
 * @purpose Tests for the G-code status report parser, ensuring accurate state and coordinate extraction.
 */
import { describe, it, expect } from 'vitest';
import { parseFluidNCProbeSettingLine, parseStatusReport } from '../utils/parser';

describe('Gtaurus Frontend Logic & Parser', () => {

  it('should correctly parse a FluidNC status report', () => {
    const rawReport = '<Idle|MPos:10.500,20.000,-5.120|Bf:15,128|FS:500,8000|WCO:0,0,0>';
    const parsed = parseStatusReport(rawReport);

    expect(parsed.state).toBe('Idle');
    expect(parsed.mpos?.x).toBe(10.500);
    expect(parsed.mpos?.y).toBe(20.000);
    expect(parsed.mpos?.z).toBe(-5.120);
    expect(parsed.buffer?.planned).toBe(15); 
    expect(parsed.buffer?.serial).toBe(128); 
    expect(parsed.feedrate).toBe(500);
    expect(parsed.spindle).toBe(8000);
  });

  it('should trigger an Emergency Alert on ALARM state', () => {
    const alarmReport = '<Alarm|MPos:0.000,0.000,0.000|WCO:0.000,0.000,0.000|Message:Hard limit reached>';
    const parsed = parseStatusReport(alarmReport);
    
    expect(parsed.state).toBe('Alarm');
  });

  it('should parse WCO accurately', () => {
    const report = '<Run|MPos:10.0,10.0,10.0|WCO:1.500,-2.000,0.000>';
    const parsed = parseStatusReport(report);

    expect(parsed.wco?.x).toBe(1.5);
    expect(parsed.wco?.y).toBe(-2.0);
    expect(parsed.wco?.z).toBe(0.0);
  });

  it('should parse Pins configuration', () => {
     const report = '<Idle|MPos:0.000,0.000,0.000|Pn:XYZ>';
     const parsed = parseStatusReport(report);

     expect(parsed.pins).toBe('XYZ');
  });

    it('should parse FluidNC probe and toolsetter pin flags', () => {
      const report = '<Idle|MPos:0.000,0.000,0.000|Pn:PT>';
      const parsed = parseStatusReport(report);

      expect(parsed.pins).toBe('PT');
    });

    it('should parse a configured FluidNC probe runtime setting line', () => {
      const parsed = parseFluidNCProbeSettingLine('$probe/pin=gpio.22:low');

      expect(parsed).toEqual({
        setting: 'pin',
        value: 'gpio.22:low',
        configured: true,
      });
    });

    it('should treat NO_PIN FluidNC probe runtime setting lines as unconfigured', () => {
      const parsed = parseFluidNCProbeSettingLine('$probe/toolsetter_pin=NO_PIN');

      expect(parsed).toEqual({
        setting: 'toolsetter_pin',
        value: 'NO_PIN',
        configured: false,
      });
    });

    it('should parse probe section key-value lines', () => {
      const parsed = parseFluidNCProbeSettingLine('pin: gpio.22:low');

      expect(parsed).toEqual({
        setting: 'pin',
        value: 'gpio.22:low',
        configured: true,
      });
    });
});
