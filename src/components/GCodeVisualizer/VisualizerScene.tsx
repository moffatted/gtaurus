import { useMemo, useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewcube, PerspectiveCamera, Environment, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useVisualizerStore, type GCodeAnalysis } from '../../stores/visualizerStore';
import { useSettingsStore } from '../../stores/settingsStore';

interface ToolBitProps {
  position: [number, number, number];
  toolType?: string;
  toolDiameter?: number;
  toolAngleDeg?: number | null;
}

function ToolBit({ position, toolType = 'flatendmill', toolDiameter = 6, toolAngleDeg }: ToolBitProps) {
  const bitLength = 30;
  const toolRadius = (toolDiameter || 6) / 2 * 0.8; // Scale down for visualization

  // Color mapping by tool type
  const getToolColor = () => {
    switch (toolType) {
      case 'vbit': return '#A855F7';      // Purple
      case 'chamfer': return '#F59E0B';   // Amber
      case 'ballnose': return '#10B981';  // Green
      case 'flatendmill': return '#3B82F6'; // Blue
      default: return '#94a3b8';           // Gray
    }
  };

  // Render different bit geometries
  const renderBitGeometry = () => {
    const color = getToolColor();
    const material = <meshStandardMaterial color={color} roughness={0.3} metalness={0.8} />;

    switch (toolType) {
      case 'vbit': {
        // V-bit: cone shape, angle-aware when provided
        const angle = toolAngleDeg && toolAngleDeg > 0 ? toolAngleDeg : 60;
        const angleRadius = Math.tan((angle * Math.PI) / 360) * (bitLength * 0.85);
        const vRadius = Math.max(toolRadius * 0.5, Math.min(toolRadius * 1.6, angleRadius));
        return (
          <mesh position={[0, -bitLength / 2, 0]} rotation={[Math.PI, 0, 0]} castShadow>
            <coneGeometry args={[vRadius, bitLength, 32]} />
            {material}
          </mesh>
        );
      }
      
      case 'ballnose': {
        // Ball nose: cylinder followed by hemisphere
        return (
          <>
            <mesh position={[0, -bitLength * 0.7, 0]} castShadow>
              <cylinderGeometry args={[toolRadius, toolRadius, bitLength * 0.7, 32]} />
              {material}
            </mesh>
            <mesh position={[0, -bitLength, 0]} castShadow>
              <sphereGeometry args={[toolRadius, 32, 32]} />
              {material}
            </mesh>
          </>
        );
      }
      
      case 'chamfer': {
        // Chamfer: short frustum cutter + short pilot tip, angle-aware and distinct from V-bit
        const angle = toolAngleDeg && toolAngleDeg > 0 ? toolAngleDeg : 90;
        const tipRadius = Math.max(0.35, toolRadius * 0.2);
        const edgeRadius = Math.max(tipRadius + 0.25, Math.min(toolRadius * 1.2, Math.tan((angle * Math.PI) / 360) * (bitLength * 0.35)));
        return (
          <>
            <mesh position={[0, -bitLength * 0.45, 0]} castShadow>
              <cylinderGeometry args={[edgeRadius, tipRadius, bitLength * 0.55, 32]} />
              {material}
            </mesh>
            <mesh position={[0, -bitLength * 0.73, 0]} castShadow>
              <cylinderGeometry args={[tipRadius, tipRadius * 0.75, bitLength * 0.16, 24]} />
              {material}
            </mesh>
          </>
        );
      }
      
      case 'flatendmill':
      default: {
        // Flat endmill: cylinder with flat bottom
        return (
          <>
            <mesh position={[0, -bitLength / 2, 0]} castShadow>
              <cylinderGeometry args={[toolRadius, toolRadius, bitLength, 32]} />
              {material}
            </mesh>
            <mesh position={[0, -bitLength, 0]} castShadow>
              <cylinderGeometry args={[toolRadius, toolRadius, 0.5, 32]} />
              {material}
            </mesh>
          </>
        );
      }
    }
  };

  return (
    <group position={position}>
      {/* Spindle Body */}
      <mesh position={[0, 40, 0]} castShadow>
        <cylinderGeometry args={[14, 14, 40, 32]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.7} />
      </mesh>
      <mesh position={[0, 14, 0]} castShadow>
        <cylinderGeometry args={[11, 12, 12, 32]} />
        <meshStandardMaterial color="#475569" roughness={0.6} metalness={0.5} />
      </mesh>
      <mesh position={[0, 4, 0]} castShadow>
        <cylinderGeometry args={[8, 10, 8, 32]} />
        <meshStandardMaterial color="#64748b" roughness={0.6} metalness={0.4} />
      </mesh>
      
      {/* Tool Bit - Rendered based on type */}
      {renderBitGeometry()}

      {/* Point Light at tip to highlight the current carve area */}
      <pointLight position={[0, -bitLength, 5]} intensity={50} distance={50} color="#ffffff" decay={2} />
    </group>
  );
}

function BedGrid({ width, height }: { width: number; height: number }) {
  const majorSpacing = 50;
  const minorSpacing = 10;
  
  const lines = useMemo(() => {
    const minorLines: number[] = [];
    const majorLines: number[] = [];
    
    // Vertical lines (X = constant)
    for (let x = 0; x <= width + 0.1; x += minorSpacing) {
      const isMajor = Math.abs(x % majorSpacing) < 0.1;
      const target = isMajor ? majorLines : minorLines;
      target.push(x - width / 2, 0, -height / 2);
      target.push(x - width / 2, 0, height / 2);
    }
    
    // Horizontal lines (Z = constant)
    for (let z = 0; z <= height + 0.1; z += minorSpacing) {
      const isMajor = Math.abs(z % majorSpacing) < 0.1;
      const target = isMajor ? majorLines : minorLines;
      target.push(-width / 2, 0, z - height / 2);
      target.push(width / 2, 0, z - height / 2);
    }
    
    return {
      minor: new Float32Array(minorLines),
      major: new Float32Array(majorLines)
    };
  }, [width, height]);

  return (
    <group>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[lines.minor, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#475569" transparent opacity={0.3} />
      </lineSegments>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[lines.major, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#94a3b8" transparent opacity={0.6} />
      </lineSegments>
    </group>
  );
}

function WCSAxes({ stockWidth, stockDepth }: { stockWidth: number; stockDepth: number }) {
  const { settings } = useSettingsStore();
  const physicalStockHeight = settings.stock.thickness;
  const labelColor = "#94a3b8";
  const labelSize = 5;
  
  const xLen = Math.max(stockWidth, 100);
  const yLen = Math.max(stockDepth, 100);
  const zLen = Math.max(physicalStockHeight + 20, 60);

  return (
    <group>
      {/* Main Axes Lines */}
      <Line points={[[0, 0.2, 0], [xLen, 0.2, 0]]} color="#ef4444" lineWidth={3} /> {/* Red = X */}
      <Line points={[[0, 0.2, 0], [0, 0.2, -yLen]]} color="#3b82f6" lineWidth={3} /> {/* Blue = Y */}
      <Line points={[[0, 0, 0], [0, zLen, 0]]} color="#10b981" lineWidth={3} /> {/* Green = Z */}


      {/* Axis Labels */}
      <Text position={[xLen + 10, 0, 0]} fontSize={12} color="#ef4444">X</Text>
      <Text position={[0, 0, -yLen - 10]} fontSize={12} color="#3b82f6">Y</Text>
      <Text position={[0, zLen + 10, 0]} fontSize={12} color="#10b981">Z</Text>

      {/* Rulers - X */}
      {Array.from({ length: Math.floor(xLen / 10) + 1 }).map((_, i) => i > 0 && (
        <Text key={`x-${i}`} position={[i * 10, 2, 10]} rotation={[-Math.PI / 2, 0, 0]}
          fontSize={labelSize} color={labelColor} anchorX="center" anchorY="middle"
        >
          {(i * 10).toString()}
        </Text>
      ))}

      {/* Rulers - Y (Backwards) */}
      {Array.from({ length: Math.floor(yLen / 10) + 1 }).map((_, i) => i > 0 && (
        <Text key={`y-${i}`} position={[-15, 2, -i * 10]} rotation={[-Math.PI / 2, 0, -Math.PI / 2]}
          fontSize={labelSize} color={labelColor} anchorX="center" anchorY="middle"
        >
          {(i * 10).toString()}
        </Text>
      ))}

      {/* Rulers - Z (Up) */}
      {Array.from({ length: Math.floor(zLen / 10) + 1 }).map((_, i) => i > 0 && (
        <Text key={`z-${i}`} position={[-15, i * 10, 0]} rotation={[0, Math.PI / 4, 0]}
          fontSize={labelSize} color={labelColor} anchorX="right" anchorY="middle"
        >
          {(i * 10).toString()}
        </Text>
      ))}
    </group>
  );
}

function CarvedStock({ 
  analysis, 
  offsetX, 
  offsetY
}: { 
  analysis: GCodeAnalysis; 
  offsetX: number;
  offsetY: number;
}) {
  const { settings } = useSettingsStore();
  const { 
    width: stockWidth, 
    height: stockDepth, 
    thickness: physicalStockHeight
  } = settings.stock;

  const totalOX = offsetX;
  const totalOY = offsetY;
  const { playbackMode, currentOperationId, isToolChangePaused, currentLineIdx } = useVisualizerStore();
  
  const dispCanvasRef = useRef<HTMLCanvasElement>(null);
  const geoRef = useRef<THREE.PlaneGeometry>(null);
  const [currentPos, setCurrentPos] = useState<[number, number, number]>([0, 20, 0]);

  const woodTexture = useLoader(THREE.TextureLoader, '/wood_texture_seamless.png');
  
  useEffect(() => {
    if (woodTexture) {
      woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
      woodTexture.repeat.set(1, 1);
      woodTexture.needsUpdate = true;
    }
  }, [woodTexture]);

  // Paint heightmap canvas, then apply CPU vertex displacement for correct 3D normals
  useEffect(() => {
    if (!dispCanvasRef.current || !analysis.points.length) return;
    
    const ctx = dispCanvasRef.current.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Background is White (Surface/0 depth) - AO map uses this (Darker = deeper = more occluded)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1024, 1024);

    let pointLimit = 0;
    const lineNum = currentLineIdx + 1; // 1-based
    for (let i = 0; i < analysis.points.length; i++) {
      if (analysis.points[i].line_number <= lineNum) pointLimit = i + 1;
      else break;
    }

    // In operation-step mode, clamp to the next operation's start boundary while paused.
    if (playbackMode === 'operation-step' && isToolChangePaused && currentOperationId !== null) {
      const nextOp = analysis.operations.find(op => op.id === currentOperationId);
      if (nextOp) {
        pointLimit = Math.min(pointLimit, nextOp.start_point_idx);
      }
    }

    const processedPoints = analysis.points.slice(0, pointLimit);

    if (pointLimit > 0) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      const pxScaleX = 1024 / stockWidth;
      const getX = (val: number) => ((val + offsetX) / stockWidth) * 1024;
      const getY = (val: number) => (1 - (val + offsetY) / stockDepth) * 1024;

      // Create operation -> tool diameter map
      const operationDiameterMap = new Map<number, { diameter: number; type: string; angleDeg: number | null }>();
      analysis.operations.forEach(op => {
        operationDiameterMap.set(op.id, {
          diameter: op.tool_diameter,
          type: op.tool_type,
          angleDeg: op.tool_angle_deg,
        });
      });

      // darken: each pixel keeps the minimum (deepest) value across overlapping passes
      ctx.globalCompositeOperation = 'darken';

      for (let i = 1; i < processedPoints.length; i++) {
          const p1 = processedPoints[i-1];
          const p2 = processedPoints[i];
          if (!p2.is_rapid && p2.z < 0) {
              const depthVal = Math.abs(p2.z);
              const ratio = Math.min(1, depthVal / physicalStockHeight);
              const grayValue = 255 - Math.floor(ratio * 255);
              
              ctx.strokeStyle = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
              // Avoid extra blurred halos that create jagged vertical walls after displacement.
              ctx.shadowBlur = 0;
              
              // Use operation-aware cutter engagement width. Angle tools use depth+angle when diameter is not explicit.
              const opTool = operationDiameterMap.get(p2.operation_id);
              const fallbackDiameter = 5;
              let effectiveDiameter = opTool?.diameter ?? fallbackDiameter;
              if (opTool && (opTool.type === 'vbit' || opTool.type === 'chamfer')) {
                if (opTool.angleDeg && opTool.angleDeg > 0) {
                  const depth = Math.abs(p2.z);
                  const angleRad = (opTool.angleDeg * Math.PI) / 180;
                  const angleBasedWidth = 2 * depth * Math.tan(angleRad / 2);
                  if (!(opTool.diameter > 0)) {
                    effectiveDiameter = Math.max(0.6, angleBasedWidth);
                  } else {
                    effectiveDiameter = Math.min(opTool.diameter, Math.max(0.6, angleBasedWidth));
                  }
                }
              }
              ctx.lineWidth = Math.max(1, effectiveDiameter * pxScaleX);
              
              ctx.beginPath();
              ctx.moveTo(getX(p1.x), getY(p1.y));
              ctx.lineTo(getX(p2.x), getY(p2.y));
              ctx.stroke();
          }
      }

      ctx.globalCompositeOperation = 'source-over';
    }

    // CPU-side vertex displacement: read heightmap, move vertices, recompute normals
    if (geoRef.current) {
      const geo = geoRef.current;
      const imgData = ctx.getImageData(0, 0, 1024, 1024);
      const pixels = imgData.data;
      const pos = geo.attributes.position;
      const wSegs = 512;
      const hSegs = 512;

      const sampleGrayBilinear = (u: number, v: number): number => {
        const x = u * 1023;
        const y = v * 1023;

        const x0 = Math.floor(x);
        const y0 = Math.floor(y);
        const x1 = Math.min(1023, x0 + 1);
        const y1 = Math.min(1023, y0 + 1);

        const tx = x - x0;
        const ty = y - y0;

        const i00 = (y0 * 1024 + x0) * 4;
        const i10 = (y0 * 1024 + x1) * 4;
        const i01 = (y1 * 1024 + x0) * 4;
        const i11 = (y1 * 1024 + x1) * 4;

        const g00 = pixels[i00];
        const g10 = pixels[i10];
        const g01 = pixels[i01];
        const g11 = pixels[i11];

        const gx0 = g00 * (1 - tx) + g10 * tx;
        const gx1 = g01 * (1 - tx) + g11 * tx;
        return gx0 * (1 - ty) + gx1 * ty;
      };

      const sampleGraySmooth = (u: number, v: number): number => {
        // Small cross-kernel smooth suppresses stair-step spikes at steep cut walls.
        const du = 1 / 1023;
        const dv = 1 / 1023;
        const uc = Math.min(1, Math.max(0, u));
        const vc = Math.min(1, Math.max(0, v));

        const c = sampleGrayBilinear(uc, vc);
        const l = sampleGrayBilinear(Math.max(0, uc - du), vc);
        const r = sampleGrayBilinear(Math.min(1, uc + du), vc);
        const d = sampleGrayBilinear(uc, Math.max(0, vc - dv));
        const up = sampleGrayBilinear(uc, Math.min(1, vc + dv));

        return (c * 4 + l + r + d + up) / 8;
      };
      
      for (let iy = 0; iy <= hSegs; iy++) {
        for (let ix = 0; ix <= wSegs; ix++) {
          const vIdx = iy * (wSegs + 1) + ix;
          const u = ix / wSegs;
          const v = iy / hSegs;
          const heightVal = sampleGraySmooth(u, v);
          // White(255) = surface (z=0), Black(0) = deepest (z=-stockHeight)
          pos.setZ(vIdx, -(1 - heightVal / 255) * physicalStockHeight);
        }
      }
      
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    }
    
    const lastP = processedPoints.length > 0 ? processedPoints[processedPoints.length - 1] : analysis.points[0];
    // Only update position if significantly different to avoid unnecessary re-renders during autoplay
    const newPos: [number, number, number] = [lastP.x + offsetX, lastP.z + physicalStockHeight + 30, -(lastP.y + offsetY)];
    setCurrentPos(prev => {
      const changed = Math.abs(prev[0] - newPos[0]) > 0.1 || Math.abs(prev[1] - newPos[1]) > 0.1 || Math.abs(prev[2] - newPos[2]) > 0.1;
      return changed ? newPos : prev;
    });
  }, [analysis, currentLineIdx, stockWidth, stockDepth, physicalStockHeight, offsetX, offsetY, playbackMode, currentOperationId, isToolChangePaused]);

  useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    dispCanvasRef.current = canvas;
    return canvas;
  }, []);

  const operationOverlay = useMemo(() => {
    const positions: number[] = [];
    const colors: number[] = [];

    const lineNum = currentLineIdx + 1;
    let pointLimit = 0;
    for (let i = 0; i < analysis.points.length; i++) {
      if (analysis.points[i].line_number <= lineNum) pointLimit = i + 1;
      else break;
    }
    const overlayY = physicalStockHeight + 0.03;

    const opColor = (opId: number) => {
      // Stable hue spacing so each operation/tool remains visually distinct.
      const hue = (opId * 0.217) % 1;
      return new THREE.Color().setHSL(hue, 0.85, 0.52);
    };

    for (let i = 1; i < pointLimit; i++) {
      const p1 = analysis.points[i - 1];
      const p2 = analysis.points[i];

      if (p2.is_rapid || p2.z >= 0) continue;

      const c = opColor(p2.operation_id || 1);

      positions.push(p1.x + offsetX, overlayY, -(p1.y + offsetY));
      positions.push(p2.x + offsetX, overlayY, -(p2.y + offsetY));

      colors.push(c.r, c.g, c.b);
      colors.push(c.r, c.g, c.b);
    }

    return {
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
      hasData: positions.length > 0,
    };
  }, [analysis.points, currentLineIdx, offsetX, offsetY, physicalStockHeight]);

  const activeOperation = useMemo(() => {
    if (!analysis.operations.length || !analysis.points.length) return null;
    const lineNum = currentLineIdx + 1;
    let lastPointIdx = 0;
    for (let i = 0; i < analysis.points.length; i++) {
      if (analysis.points[i].line_number <= lineNum) lastPointIdx = i;
      else break;
    }
    const activePoint = analysis.points[lastPointIdx];
    return analysis.operations.find(op => op.id === activePoint.operation_id) ?? analysis.operations[0];
  }, [analysis.operations, analysis.points, currentLineIdx]);

  const midX = stockWidth / 2;
  const midZ = -stockDepth / 2;

  return (
    <group>
      {/* Wood base block - Slightly shorter than physicalStockHeight to prevent z-fighting with the carved surface plane */}
      <mesh position={[midX, (physicalStockHeight - 0.1) / 2, midZ]} receiveShadow>
        <boxGeometry args={[stockWidth, physicalStockHeight - 0.1, stockDepth]} />
        <meshStandardMaterial attach="material-0" color="#5d4037" roughness={0.9} />
        <meshStandardMaterial attach="material-1" color="#5d4037" roughness={0.9} />
        {/* Top face must be transparent so displaced carve depths are not visually occluded by a flat cap */}
        <meshStandardMaterial attach="material-2" transparent opacity={0} depthWrite={false} />
        <meshStandardMaterial attach="material-3" color="#5d4037" roughness={0.9} />
        <meshStandardMaterial attach="material-4" color="#5d4037" roughness={0.9} />
        <meshStandardMaterial attach="material-5" color="#5d4037" roughness={0.9} />
      </mesh>

      {/* Carved Surface - Elevated slightly to be the true top surface */}
      <mesh position={[midX, physicalStockHeight, midZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry ref={geoRef} args={[stockWidth, stockDepth, 512, 512]} />
        <meshStandardMaterial
          map={woodTexture}
          roughness={0.4}
          metalness={0.05}
          envMapIntensity={0.5}
        />
      </mesh>

      {/* Per-operation cut overlay (color-per-bit) */}
      {operationOverlay.hasData && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[operationOverlay.positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[operationOverlay.colors, 3]} />
          </bufferGeometry>
          <lineBasicMaterial vertexColors transparent opacity={0.95} />
        </lineSegments>
      )}

      <ToolBit 
        position={currentPos} 
        toolType={activeOperation?.tool_type}
        toolDiameter={activeOperation?.tool_diameter}
        toolAngleDeg={activeOperation?.tool_angle_deg}
      />


      {/* Job Footprint Bounding Box */}
      {(() => {
        const bx0 = totalOX + analysis.bbox_min[0];
        const bx1 = totalOX + analysis.bbox_max[0];
        const bz0 = -(totalOY + analysis.bbox_min[1]);
        const bz1 = -(totalOY + analysis.bbox_max[1]);
        const by = physicalStockHeight + 0.2;
        return (
          <Line
            points={[[bx0, by, bz0], [bx1, by, bz0], [bx1, by, bz1], [bx0, by, bz1], [bx0, by, bz0]]}
            color="#3b82f6"
            lineWidth={1.5}
            transparent
            opacity={0.6}
          />
        );
      })()}
    </group>
  );
}

export function VisualizerScene() {
  const { analysis, isToolChangePaused, currentOperationId, resumeFromToolChangePause } = useVisualizerStore();
  const { settings } = useSettingsStore();
  
  const stockWidth = settings.stock.width;
  const stockDepth = settings.stock.height;

  const currentOperation = useMemo(() => {
    if (!analysis || !currentOperationId) return null;
    return analysis.operations.find(op => op.id === currentOperationId);
  }, [analysis, currentOperationId]);

  const center = useMemo(() => {
    // The camera target should be the center of the stock, not the G-code origin.
    return new THREE.Vector3(stockWidth / 2, 0, -stockDepth / 2);
  }, [stockWidth, stockDepth]);

  if (!analysis) return null;

  return (
    <div className="relative w-full h-full flex flex-col">
    <Canvas 
      shadows 
      gl={{ antialias: true, logarithmicDepthBuffer: true }}
      className="w-full flex-1 cursor-move"
    >
      <Suspense fallback={null}>
        <PerspectiveCamera makeDefault position={[200, 250, 200]} fov={30} />
        <Environment preset="studio" />
        
        {/* Balanced Lighting */}
        <ambientLight intensity={0.2} />
        <directionalLight 
          position={[100, 200, 100]} 
          intensity={2.0} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        <spotLight 
          position={[-100, 300, 50]} 
          angle={0.2} 
          penumbra={1} 
          intensity={1.5} 
          castShadow 
        />
        
        <OrbitControls makeDefault enableDamping dampingFactor={0.08} target={center} />
        
        {/* Professional Brushed Metal Machine Bed */}
        <group position={[settings.general.bedSizeX / 2, -0.05, -settings.general.bedSizeY / 2]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[settings.general.bedSizeX, settings.general.bedSizeY]} />
            <meshStandardMaterial 
              color="#1e293b" 
              metalness={0.7} 
              roughness={0.25} 
              envMapIntensity={0.8} 
            />
          </mesh>
          
          {/* Robust Technical Grid */}
          <group position={[0, 0.05, 0]}>
            <BedGrid width={settings.general.bedSizeX} height={settings.general.bedSizeY} />
          </group>
        </group>
        
        <CarvedStock 
          analysis={analysis} 
          offsetX={settings.stock.offsetX}
          offsetY={settings.stock.offsetY}
        />

        {/* WCS Axes pinned to Front-Left Corner of Bed */}
        <group position={[0, 0.1, 0]}>
          <WCSAxes stockWidth={stockWidth} stockDepth={stockDepth} />
        </group>

        <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
          <GizmoViewcube />
        </GizmoHelper>
      </Suspense>
    </Canvas>
    
    {/* Tool-change pause banner */}
    {isToolChangePaused && currentOperation && (
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-orange-500 text-white px-8 py-6 rounded-lg shadow-2xl pointer-events-auto flex flex-col items-center gap-4">
          <div className="text-2xl font-bold">Tool Change Required</div>
          <div className="text-lg">
            {currentOperation.tool_number ? `Swap to Tool T${currentOperation.tool_number}` : 'Swap to next tool'}
          </div>
          <button 
            onClick={() => resumeFromToolChangePause()}
            className="bg-white text-orange-500 font-bold px-6 py-2 rounded hover:bg-gray-100 transition"
          >
            Continue
          </button>
        </div>
      </div>
    )}
    </div>
  );
}
