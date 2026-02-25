import React from 'react';
import { type ToolType } from '../../stores/toolStore';

// ─── Types ─────────────────────────────────────────────────────────────────

interface BitVisualizerProps {
  type: ToolType;
  diameter: number;          // mm
  fluteLength?: number;      // mm
  overallLength?: number;    // mm
  angle?: number;            // degrees (v-bit)
  size?: number;             // px — bounding box height
  isActive?: boolean;
  className?: string;
}

// ─── Color Palette ─────────────────────────────────────────────────────────

const FLUTE_COLORS: Record<ToolType, { fill: string; stroke: string; shank: string }> = {
  endmill:   { fill: '#3B82F6', stroke: '#2563EB', shank: '#6B7280' },
  'v-bit':   { fill: '#A855F7', stroke: '#7C3AED', shank: '#6B7280' },
  ballnose:  { fill: '#10B981', stroke: '#059669', shank: '#6B7280' },
  surfacing: { fill: '#F59E0B', stroke: '#D97706', shank: '#6B7280' },
  other:     { fill: '#6B7280', stroke: '#4B5563', shank: '#6B7280' },
};

// ─── Component ─────────────────────────────────────────────────────────────

export function BitVisualizer({
  type,
  diameter,
  fluteLength,
  overallLength,
  angle,
  size = 80,
  isActive = false,
  className = '',
}: BitVisualizerProps) {
  const colors = FLUTE_COLORS[type] || FLUTE_COLORS.other;

  // Normalize dimensions into the SVG viewport
  const viewW = 60;
  const viewH = 100;

  // Flute section proportions (relative to viewH)
  const fl = fluteLength ?? diameter * 3;
  const ol = overallLength ?? fl * 2.5;
  const fluteRatio = Math.min(fl / ol, 0.65);          // max 65% of height
  const diamRatio  = Math.min(diameter / 26, 1);        // scale width relative to ~26mm max

  const shankW = Math.max(8, diamRatio * 18);            // px width in SVG units
  const fluteW = Math.max(shankW, diamRatio * viewW * 0.8);
  const fluteH = fluteRatio * viewH * 0.7;
  const shankH = viewH * 0.7 - fluteH;

  // Centering helper
  const cx = viewW / 2;
  const topY = 8;                                        // top padding

  const shankPath = buildShankPath(cx, topY, shankW, shankH);
  const flutePath = buildFlutePath(type, cx, topY + shankH, fluteW, fluteH, angle);

  const glowId = `glow-${type}`;

  return (
    <svg
      viewBox={`0 0 ${viewW} ${viewH}`}
      width={size * 0.6}
      height={size}
      className={className}
      aria-label={`${type} bit visualization`}
    >
      <defs>
        {/* Glow filter for active state */}
        <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Metallic gradient for shank */}
        <linearGradient id="shankGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#9CA3AF" />
          <stop offset="40%" stopColor="#D1D5DB" />
          <stop offset="60%" stopColor="#D1D5DB" />
          <stop offset="100%" stopColor="#9CA3AF" />
        </linearGradient>
        {/* Flute gradient */}
        <linearGradient id={`fluteGrad-${type}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={colors.stroke} />
          <stop offset="35%" stopColor={colors.fill} />
          <stop offset="65%" stopColor={colors.fill} />
          <stop offset="100%" stopColor={colors.stroke} />
        </linearGradient>
      </defs>

      <g filter={isActive ? `url(#${glowId})` : undefined}>
        {/* Shank */}
        <path
          d={shankPath}
          fill="url(#shankGrad)"
          stroke="#6B7280"
          strokeWidth="0.5"
        />
        {/* Collar ring at shank/flute junction */}
        <line
          x1={cx - fluteW / 2}
          y1={topY + shankH}
          x2={cx + fluteW / 2}
          y2={topY + shankH}
          stroke="#4B5563"
          strokeWidth="1.2"
          strokeLinecap="round"
        />
        {/* Flute body */}
        <path
          d={flutePath}
          fill={`url(#fluteGrad-${type})`}
          stroke={colors.stroke}
          strokeWidth="0.6"
          strokeLinejoin="round"
        />
        {/* Flute spiral lines (decorative) */}
        {type !== 'surfacing' && renderSpiralLines(type, cx, topY + shankH, fluteW, fluteH, colors.stroke, angle)}
      </g>
    </svg>
  );
}

// ─── Path Builders ─────────────────────────────────────────────────────────

function buildShankPath(cx: number, topY: number, w: number, h: number): string {
  const left = cx - w / 2;
  const right = cx + w / 2;
  const r = Math.min(2, w / 4); // rounded top
  return `M${left + r},${topY} Q${left},${topY} ${left},${topY + r} L${left},${topY + h} L${right},${topY + h} L${right},${topY + r} Q${right},${topY} ${right - r},${topY} Z`;
}

function buildFlutePath(
  type: ToolType,
  cx: number,
  topY: number,
  w: number,
  h: number,
  _angle?: number,
): string {
  const left = cx - w / 2;
  const right = cx + w / 2;
  const bottom = topY + h;

  switch (type) {
    case 'endmill': {
      // Straight rectangle with tiny rounded bottom-left/right
      const r = Math.min(1, w / 6);
      return `M${left},${topY} L${left},${bottom - r} Q${left},${bottom} ${left + r},${bottom} L${right - r},${bottom} Q${right},${bottom} ${right},${bottom - r} L${right},${topY} Z`;
    }

    case 'v-bit': {
      // Triangular converging to a point
      const tipY = bottom;
      // The sides angle inward from full width to a point
      return `M${left},${topY} L${cx},${tipY} L${right},${topY} Z`;
    }

    case 'ballnose': {
      // Rectangle with semicircular bottom
      const r = w / 2;
      const bodyH = Math.max(0, h - r);
      return `M${left},${topY} L${left},${topY + bodyH} A${r},${r} 0 0 0 ${right},${topY + bodyH} L${right},${topY} Z`;
    }

    case 'surfacing': {
      // Wide, short rectangle — flat bottom, slight taper
      const inset = w * 0.05;
      return `M${left + inset},${topY} L${left},${bottom} L${right},${bottom} L${right - inset},${topY} Z`;
    }

    default: {
      // Generic rectangle
      return `M${left},${topY} L${left},${bottom} L${right},${bottom} L${right},${topY} Z`;
    }
  }
}

// ─── Decorative spiral (flute) lines ────────────────────────────────────────

function renderSpiralLines(
  type: ToolType,
  cx: number,
  topY: number,
  w: number,
  h: number,
  strokeColor: string,
  _angle?: number,
) {
  const lines: React.ReactElement[] = [];
  const count = 4;

  for (let i = 1; i <= count; i++) {
    const t = i / (count + 1);
    const y = topY + t * h;

    if (type === 'v-bit') {
      // Lines narrow as they approach the tip
      const progress = t;
      const halfW = (w / 2) * (1 - progress);
      lines.push(
        <line
          key={i}
          x1={cx - halfW * 0.7}
          y1={y}
          x2={cx + halfW * 0.7}
          y2={y}
          stroke={strokeColor}
          strokeWidth="0.4"
          opacity={0.35}
        />
      );
    } else if (type === 'ballnose') {
      const r = w / 2;
      const bodyH = Math.max(0, h - r);
      if (y < topY + bodyH) {
        // In the straight section
        lines.push(
          <line
            key={i}
            x1={cx - w * 0.35}
            y1={y}
            x2={cx + w * 0.35}
            y2={y}
            stroke={strokeColor}
            strokeWidth="0.4"
            opacity={0.35}
          />
        );
      }
    } else {
      // endmill / other — straight horizontal marks
      lines.push(
        <line
          key={i}
          x1={cx - w * 0.35}
          y1={y}
          x2={cx + w * 0.35}
          y2={y}
          stroke={strokeColor}
          strokeWidth="0.4"
          opacity={0.35}
        />
      );
    }
  }
  return lines;
}
