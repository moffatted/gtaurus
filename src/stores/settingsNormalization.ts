import type { ProbeSettings, StockSettings } from "./settingsStore";

export function normalizeSavedStock(
  savedStock: any,
  defaultStock: StockSettings,
): Partial<StockSettings> {
  if (!savedStock) return {};

  return {
    ...savedStock,
    zeroX: savedStock.zeroX ?? savedStock.posX ?? defaultStock.zeroX,
    zeroY: savedStock.zeroY ?? savedStock.posY ?? defaultStock.zeroY,
    workOffsetX: savedStock.workOffsetX ?? savedStock.offsetX ?? defaultStock.workOffsetX,
    workOffsetY: savedStock.workOffsetY ?? savedStock.offsetY ?? defaultStock.workOffsetY,
    workOffsetZ: savedStock.workOffsetZ ?? savedStock.offsetZ ?? defaultStock.workOffsetZ,
  };
}

export function normalizeSavedProbe(
  savedProbe: any,
  defaultProbe: ProbeSettings,
): Partial<ProbeSettings> {
  if (!savedProbe) return {};

  const toNumber = (value: any, fallback: number): number => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  return {
    ...savedProbe,
    xWallThickness: toNumber(savedProbe.xWallThickness, defaultProbe.xWallThickness),
    yWallThickness: toNumber(savedProbe.yWallThickness, defaultProbe.yWallThickness),
    holeDiameter: toNumber(savedProbe.holeDiameter, defaultProbe.holeDiameter),
    xyDropDistance: toNumber(savedProbe.xyDropDistance, defaultProbe.xyDropDistance),
    xEdgeClearance: toNumber(savedProbe.xEdgeClearance, defaultProbe.xEdgeClearance),
    yEdgeClearance: toNumber(savedProbe.yEdgeClearance, defaultProbe.yEdgeClearance),
    centeringFudge: toNumber(savedProbe.centeringFudge, defaultProbe.centeringFudge),
    zTouchPlateShape: savedProbe.zTouchPlateShape === "round" ? "round" : "square",
    zTouchPlateLength: toNumber(savedProbe.zTouchPlateLength, defaultProbe.zTouchPlateLength),
    zTouchPlateWidth: toNumber(savedProbe.zTouchPlateWidth, defaultProbe.zTouchPlateWidth),
    zTouchPlateDiameter: toNumber(savedProbe.zTouchPlateDiameter, defaultProbe.zTouchPlateDiameter),
    zTouchPlateInsetX: toNumber(savedProbe.zTouchPlateInsetX, defaultProbe.zTouchPlateInsetX),
    zTouchPlateInsetY: toNumber(savedProbe.zTouchPlateInsetY, defaultProbe.zTouchPlateInsetY),
    plateGeometry: savedProbe.plateGeometry === "ring-hole" ? "ring-hole" : "solid-block",
    postProbeReturnMode: savedProbe.postProbeReturnMode === "auto-return-xy0" ? "auto-return-xy0" : "hold-z",
    lastProbeMethod: savedProbe.lastProbeMethod === "3-axis" ? "3-axis" : "z-only",
  };
}
