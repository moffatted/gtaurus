import { describe, it, expect } from 'vitest';
import { normalizeSavedStock, normalizeSavedProbe } from './settingsNormalization';
import type { ProbeSettings, StockSettings } from './settingsStore';

const defaultStock = {
  zeroX: 0,
  zeroY: 0,
  workOffsetX: 0,
  workOffsetY: 0,
  workOffsetZ: 0,
} as unknown as StockSettings;

const defaultProbe = {
  xWallThickness: 5,
  yWallThickness: 5,
  holeDiameter: 15,
  xyDropDistance: 3,
  xEdgeClearance: 2,
  yEdgeClearance: 2,
  centeringFudge: 0,
  zTouchPlateShape: 'square' as const,
  zTouchPlateLength: 40,
  zTouchPlateWidth: 40,
  zTouchPlateDiameter: 40,
  zTouchPlateInsetX: 5,
  zTouchPlateInsetY: 5,
  plateGeometry: 'solid-block' as const,
  postProbeReturnMode: 'hold-z' as const,
  lastProbeMethod: 'z-only' as const,
  showTouchPlateVisual: false,
  touchPlateLength: 40,
  touchPlateWidth: 40,
  touchPlateWrapDepth: 5,
  touchPlateWrapHeight: 5,
  touchPlateCorner: 'front-left' as const,
} as unknown as ProbeSettings;

describe('normalizeSavedStock', () => {
  it('returns empty object for null/undefined input', () => {
    expect(normalizeSavedStock(null, defaultStock)).toEqual({});
    expect(normalizeSavedStock(undefined, defaultStock)).toEqual({});
  });

  it('passes through modern keys unchanged', () => {
    const saved = { width: 200, height: 30, zeroX: 5, zeroY: 10, workOffsetX: 1, workOffsetY: 2, workOffsetZ: 3 };
    const result = normalizeSavedStock(saved, defaultStock);
    expect(result.workOffsetX).toBe(1);
    expect(result.workOffsetY).toBe(2);
    expect(result.workOffsetZ).toBe(3);
    expect(result.zeroX).toBe(5);
    expect(result.zeroY).toBe(10);
  });

  it('migrates legacy posX/posY to zeroX/zeroY', () => {
    const legacy = { posX: 25, posY: 50 };
    const result = normalizeSavedStock(legacy, defaultStock);
    expect(result.zeroX).toBe(25);
    expect(result.zeroY).toBe(50);
  });

  it('migrates legacy offsetX/offsetY/offsetZ to workOffset fields', () => {
    const legacy = { offsetX: 10, offsetY: 20, offsetZ: 5 };
    const result = normalizeSavedStock(legacy, defaultStock);
    expect(result.workOffsetX).toBe(10);
    expect(result.workOffsetY).toBe(20);
    expect(result.workOffsetZ).toBe(5);
  });

  it('prefers modern keys over legacy keys when both present', () => {
    const mixed = { zeroX: 15, posX: 99, workOffsetX: 7, offsetX: 99 };
    const result = normalizeSavedStock(mixed, defaultStock);
    expect(result.zeroX).toBe(15);
    expect(result.workOffsetX).toBe(7);
  });

  it('falls back to default when both modern and legacy keys are absent', () => {
    const result = normalizeSavedStock({}, defaultStock);
    expect(result.zeroX).toBe(defaultStock.zeroX);
    expect(result.zeroY).toBe(defaultStock.zeroY);
    expect(result.workOffsetX).toBe(defaultStock.workOffsetX);
  });
});

describe('normalizeSavedProbe', () => {
  it('returns empty object for null/undefined input', () => {
    expect(normalizeSavedProbe(null, defaultProbe)).toEqual({});
    expect(normalizeSavedProbe(undefined, defaultProbe)).toEqual({});
  });

  it('coerces string numbers to actual numbers', () => {
    const saved = { xWallThickness: '7.5', yWallThickness: '3', holeDiameter: '12' };
    const result = normalizeSavedProbe(saved, defaultProbe);
    expect(result.xWallThickness).toBe(7.5);
    expect(result.yWallThickness).toBe(3);
    expect(result.holeDiameter).toBe(12);
  });

  it('falls back to default for non-finite numeric values', () => {
    const saved = { xWallThickness: 'bad', yWallThickness: NaN, holeDiameter: 'not-a-number' };
    const result = normalizeSavedProbe(saved, defaultProbe);
    expect(result.xWallThickness).toBe(defaultProbe.xWallThickness);
    expect(result.yWallThickness).toBe(defaultProbe.yWallThickness);
    expect(result.holeDiameter).toBe(defaultProbe.holeDiameter);
  });

  it('normalizes zTouchPlateShape to "round" or "square"', () => {
    expect(normalizeSavedProbe({ zTouchPlateShape: 'round' }, defaultProbe).zTouchPlateShape).toBe('round');
    expect(normalizeSavedProbe({ zTouchPlateShape: 'anything-else' }, defaultProbe).zTouchPlateShape).toBe('square');
  });

  it('normalizes plateGeometry to "ring-hole" or "solid-block"', () => {
    expect(normalizeSavedProbe({ plateGeometry: 'ring-hole' }, defaultProbe).plateGeometry).toBe('ring-hole');
    expect(normalizeSavedProbe({ plateGeometry: 'unknown' }, defaultProbe).plateGeometry).toBe('solid-block');
  });

  it('normalizes postProbeReturnMode', () => {
    expect(normalizeSavedProbe({ postProbeReturnMode: 'auto-return-xy0' }, defaultProbe).postProbeReturnMode).toBe('auto-return-xy0');
    expect(normalizeSavedProbe({ postProbeReturnMode: 'other' }, defaultProbe).postProbeReturnMode).toBe('hold-z');
  });

  it('normalizes lastProbeMethod', () => {
    expect(normalizeSavedProbe({ lastProbeMethod: '3-axis' }, defaultProbe).lastProbeMethod).toBe('3-axis');
    expect(normalizeSavedProbe({ lastProbeMethod: 'other' }, defaultProbe).lastProbeMethod).toBe('z-only');
  });
});
