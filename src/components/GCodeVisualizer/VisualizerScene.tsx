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

type ZeroPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

function getWcsAnchor(zeroPosition: ZeroPosition, stockWidth: number, stockDepth: number) {
  switch (zeroPosition) {
    case 'center':
      return { x: stockWidth / 2, z: -stockDepth / 2 };
    case 'top-right':
      return { x: stockWidth, z: -stockDepth };
    case 'top-left':
      return { x: 0, z: -stockDepth };
    case 'bottom-right':
      return { x: stockWidth, z: 0 };
    case 'bottom-left':
    default:
      return { x: 0, z: 0 };
  }
}

function getStockCenter(stockWidth: number, stockDepth: number) {
  return { x: stockWidth / 2, z: -stockDepth / 2 };
}

function ToolBit({ position, toolType = 'flatendmill', toolDiameter = 6, toolAngleDeg }: ToolBitProps) {
  // Color mapping by tool type for the flute (cutting part)
  const getToolColor = () => {
    switch (toolType) {
      case 'vbit': 
      case 'v-bit': return '#A855F7';      // Purple
      case 'chamfer': return '#F59E0B';    // Amber
      case 'ballnose': return '#10B981';   // Green
      case 'flatendmill': 
      case 'endmill': return '#3B82F6';    // Blue
      case 'surfacing': return '#F59E0B';  // Orange/Amber (Surfacing)
      case 'other':
      default: return '#94a3b8';           // Gray
    }
  };

  // Calculate proportional dimensions similar to BitVisualizer
  const toolDiam = toolDiameter || 6;
  const toolR = toolDiam / 2;
  const fl = toolDiam * 3;
  const ol = fl * 2.5;
  const bitLength = Math.min(Math.max(ol, 20), 45); 
  const fluteLength = bitLength * Math.min(fl / ol, 0.65);
  const shankLength = bitLength - fluteLength;
  // Shank is typically equal to tool diam, but commonly at least 1/8" (3.175mm)
  let shankRadius = Math.max(toolR, 3.175 / 2); 
  if (toolType === 'surfacing') {
    shankRadius = Math.min(shankRadius, 6.35); // Cap shank at 1/2" for surfacing bits
  }

  const renderBitGeometry = () => {
    const fluteColor = getToolColor();
    const shankMaterial = <meshStandardMaterial color="#cbd5e1" roughness={0.4} metalness={0.8} />;
    const fluteMaterial = <meshStandardMaterial color={fluteColor} roughness={0.3} metalness={0.8} />;

    const shankMesh = (
      <mesh position={[0, -shankLength / 2, 0]} castShadow>
        <cylinderGeometry args={[shankRadius, shankRadius, shankLength, 32]} />
        {shankMaterial}
      </mesh>
    );

    switch (toolType) {
      case 'v-bit':
      case 'vbit': {
        const angle = toolAngleDeg && toolAngleDeg > 0 ? toolAngleDeg : 60;
        const angleRad = (angle * Math.PI) / 360; 
        let h = toolR / Math.tan(angleRad);
        h = Math.min(h, fluteLength);
        const straightFluteLen = Math.max(0, fluteLength - h);

        return (
          <>
            {shankMesh}
            {straightFluteLen > 0 && (
              <mesh position={[0, -shankLength - straightFluteLen / 2, 0]} castShadow>
                 <cylinderGeometry args={[toolR, toolR, straightFluteLen, 32]} />
                 {fluteMaterial}
              </mesh>
            )}
            <mesh position={[0, -shankLength - straightFluteLen - h / 2, 0]} castShadow>
              <cylinderGeometry args={[toolR, 0, h, 32]} />
              {fluteMaterial}
            </mesh>
          </>
        );
      }
      
      case 'ballnose': {
        const h = Math.max(0, fluteLength - toolR);
        return (
          <>
            {shankMesh}
            <mesh position={[0, -shankLength - h / 2, 0]} castShadow>
              <cylinderGeometry args={[toolR, toolR, h, 32]} />
              {fluteMaterial}
            </mesh>
            <mesh position={[0, -shankLength - h, 0]} castShadow>
              {/* parameters: radius, widthSeg, heightSeg, phiStart, phiLength, thetaStart, thetaLength */}
              <sphereGeometry args={[toolR, 32, 32, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
              {fluteMaterial}
            </mesh>
          </>
        );
      }
      
      case 'chamfer': {
        const angle = toolAngleDeg && toolAngleDeg > 0 ? toolAngleDeg : 90;
        const tipRadius = Math.max(0.35, toolR * 0.2);
        const angleRad = (angle * Math.PI) / 360; 
        let h = (toolR - tipRadius) / Math.tan(angleRad);
        h = Math.min(h, fluteLength);
        const straightFluteLen = Math.max(0, fluteLength - h);

        return (
          <>
            {shankMesh}
            {straightFluteLen > 0 && (
              <mesh position={[0, -shankLength - straightFluteLen / 2, 0]} castShadow>
                 <cylinderGeometry args={[toolR, toolR, straightFluteLen, 32]} />
                 {fluteMaterial}
              </mesh>
            )}
            <mesh position={[0, -shankLength - straightFluteLen - h / 2, 0]} castShadow>
              <cylinderGeometry args={[toolR, tipRadius, h, 32]} />
              {fluteMaterial}
            </mesh>
          </>
        );
      }
      
      case 'surfacing': {
        // Wide cutting head, standard capped shank
        const headH = Math.min(fluteLength, toolR * 0.35); // Short, wide flange

        return (
          <>
            {shankMesh}
            <mesh position={[0, -shankLength - headH / 2, 0]} castShadow>
              <cylinderGeometry args={[toolR, toolR, headH, 32]} />
              {fluteMaterial}
            </mesh>
          </>
        );
      }
      
      case 'other':
      case 'endmill':
      case 'flatendmill':
      default: {
        return (
          <>
            {shankMesh}
            <mesh position={[0, -shankLength - fluteLength / 2, 0]} castShadow>
              <cylinderGeometry args={[toolR, toolR, fluteLength, 32]} />
              {fluteMaterial}
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
      target.push(x, 0, 0);
      target.push(x, 0, -height);
    }
    
    // Horizontal lines (Z = constant)
    for (let z = 0; z <= height + 0.1; z += minorSpacing) {
      const isMajor = Math.abs(z % majorSpacing) < 0.1;
      const target = isMajor ? majorLines : minorLines;
      target.push(0, 0, -z);
      target.push(width, 0, -z);
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
  analysis
}: { 
  analysis: GCodeAnalysis; 
}) {
  const { settings } = useSettingsStore();
  const { 
    width: stockWidth, 
    height: stockDepth, 
    thickness: physicalStockHeight,
    material: stockMaterial,
    opacity: stockOpacity
  } = settings.stock;

  // WCS zero in world space — workpiece always sits at front-left corner of bed (0,0).
  // zeroPosition defines where on the workpiece the G-code origin (0,0) is located.
  const { x: wcx, z: wcz } = useMemo(
    () => getWcsAnchor(settings.stock.zeroPosition, stockWidth, stockDepth),
    [stockWidth, stockDepth, settings.stock.zeroPosition]
  );

  const { playbackMode, currentOperationId, isToolChangePaused, currentLineIdx } = useVisualizerStore();
  
  const dispCanvasRef = useRef<HTMLCanvasElement>(null);
  const geoRef = useRef<THREE.PlaneGeometry>(null);
  const [currentPos, setCurrentPos] = useState<[number, number, number]>([0, 20, 0]);

  // Texture Loading
  const woodTexture = useLoader(THREE.TextureLoader, '/wood_texture_seamless.png');
  
  useEffect(() => {
    if (woodTexture) {
      woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
      woodTexture.repeat.set(1, 1);
      woodTexture.needsUpdate = true;
    }
  }, [woodTexture]);

  // Material selection
  const getMaterialProps = () => {
    switch (stockMaterial) {
      case 'aluminum':
        return { color: '#94a3b8', metalness: 0.9, roughness: 0.2, map: null };
      case 'pcb':
        return { 
          color: '#064e3b', // Deep forest green
          metalness: 0.6, 
          roughness: 0.2, 
          map: null,
          emissive: '#112211',
          emissiveIntensity: 0.1
        };
      case 'pvc':
        return { color: '#f8fafc', metalness: 0.1, roughness: 0.5, map: null };
      case 'mdf':
        return { color: '#d97706', metalness: 0, roughness: 0.8, map: null };
      case 'darkoak':
        return { color: '#451a03', metalness: 0.05, roughness: 0.6, map: woodTexture };
      case 'pine':
      default:
        return { color: '#ffffff', metalness: 0.05, roughness: 0.4, map: woodTexture };
    }
  };

  const matProps = getMaterialProps();

  // Paint heightmap canvas
  useEffect(() => {
    if (!dispCanvasRef.current || !analysis.points.length) return;
    
    const ctx = dispCanvasRef.current.getContext('2d', { alpha: false });
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 1024, 1024);

    let pointLimit = 0;
    const lineNum = currentLineIdx + 1;
    for (let i = 0; i < analysis.points.length; i++) {
      if (analysis.points[i].line_number <= lineNum) pointLimit = i + 1;
      else break;
    }

    if (playbackMode === 'operation-step' && isToolChangePaused && currentOperationId !== null) {
      const nextOp = analysis.operations.find(op => op.id === currentOperationId);
      if (nextOp) pointLimit = Math.min(pointLimit, nextOp.start_point_idx);
    }

    const processedPoints = analysis.points.slice(0, pointLimit);

    if (pointLimit > 0) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      const pxScaleX = 1024 / stockWidth;
      const getX = (val: number) => ((val + wcx) / stockWidth) * 1024;
      const getY = (val: number) => (1 - (val + (-wcz)) / stockDepth) * 1024;

      const operationDiameterMap = new Map<number, { diameter: number; type: string; angleDeg: number | null }>();
      analysis.operations.forEach(op => {
        operationDiameterMap.set(op.id, {
          diameter: op.tool_diameter,
          type: op.tool_type,
          angleDeg: op.tool_angle_deg,
        });
      });

      ctx.globalCompositeOperation = 'darken';

      for (let i = 1; i < processedPoints.length; i++) {
          const p1 = processedPoints[i-1];
          const p2 = processedPoints[i];
          if (!p2.is_rapid && p2.z < 0) {
              const depthVal = Math.abs(p2.z);
              const ratio = Math.min(1, depthVal / physicalStockHeight);
              const grayValue = 255 - Math.floor(ratio * 255);
              
              ctx.strokeStyle = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
              ctx.shadowBlur = 0;
              
              const opTool = operationDiameterMap.get(p2.operation_id);
              let effectiveDiameter = opTool?.diameter ?? 5;
              if (opTool && (opTool.type === 'vbit' || opTool.type === 'chamfer')) {
                if (opTool.angleDeg && opTool.angleDeg > 0) {
                  const depth = Math.abs(p2.z);
                  const angleRad = (opTool.angleDeg * Math.PI) / 180;
                  const angleBasedWidth = 2 * depth * Math.tan(angleRad / 2);
                  effectiveDiameter = opTool.diameter > 0 ? Math.min(opTool.diameter, Math.max(0.6, angleBasedWidth)) : Math.max(0.6, angleBasedWidth);
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

    if (geoRef.current) {
      const geo = geoRef.current;
      const imgData = ctx.getImageData(0, 0, 1024, 1024);
      const pixels = imgData.data;
      const pos = geo.attributes.position;
      const wSegs = 512;
      const hSegs = 512;

      const sampleGraySmooth = (u: number, v: number): number => {
        const x = u * 1023; const y = v * 1023;
        const x0 = Math.floor(x); const y0 = Math.floor(y);
        const x1 = Math.min(1023, x0 + 1); const y1 = Math.min(1023, y0 + 1);
        const tx = x - x0; const ty = y - y0;
        const i00 = (y0 * 1024 + x0) * 4; const i10 = (y0 * 1024 + x1) * 4;
        const i01 = (y1 * 1024 + x0) * 4; const i11 = (y1 * 1024 + x1) * 4;
        const g00 = pixels[i00]; const g10 = pixels[i10]; const g01 = pixels[i01]; const g11 = pixels[i11];
        const gx0 = g00 * (1 - tx) + g10 * tx; const gx1 = g01 * (1 - tx) + g11 * tx;
        return gx0 * (1 - ty) + gx1 * ty;
      };
      
      for (let iy = 0; iy <= hSegs; iy++) {
        for (let ix = 0; ix <= wSegs; ix++) {
          const vIdx = iy * (wSegs + 1) + ix;
          const u = ix / wSegs; const v = iy / hSegs;
          const heightVal = sampleGraySmooth(u, v);
          pos.setZ(vIdx, -(1 - heightVal / 255) * physicalStockHeight);
        }
      }
      pos.needsUpdate = true;
      geo.computeVertexNormals();
    }
    
    const lastP = processedPoints.length > 0 ? processedPoints[processedPoints.length - 1] : analysis.points[0];
    const newPos: [number, number, number] = [
      wcx + lastP.x,
      lastP.z + physicalStockHeight + 30, 
      wcz - lastP.y
    ];
    setCurrentPos(prev => {
      const changed = Math.abs(prev[0] - newPos[0]) > 0.1 || Math.abs(prev[1] - newPos[1]) > 0.1 || Math.abs(prev[2] - newPos[2]) > 0.1;
      return changed ? newPos : prev;
    });
  }, [analysis, currentLineIdx, stockWidth, stockDepth, physicalStockHeight, wcx, wcz, playbackMode, currentOperationId, isToolChangePaused]);

  useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024; canvas.height = 1024;
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
    const opColor = (opId: number) => new THREE.Color().setHSL((opId * 0.217) % 1, 0.85, 0.52);

    for (let i = 1; i < pointLimit; i++) {
      const p1 = analysis.points[i - 1];
      const p2 = analysis.points[i];
      if (p2.is_rapid || p2.z >= 0) continue;
      const c = opColor(p2.operation_id || 1);
      positions.push(wcx + p1.x, overlayY, wcz - p1.y);
      positions.push(wcx + p2.x, overlayY, wcz - p2.y);
      colors.push(c.r, c.g, c.b, c.r, c.g, c.b);
    }

    return {
      positions: new Float32Array(positions),
      colors: new Float32Array(colors),
      hasData: positions.length > 0,
    };
  }, [analysis.points, currentLineIdx, wcx, wcz, physicalStockHeight]);

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

  const { x: midX, z: midZ } = useMemo(
    () => getStockCenter(stockWidth, stockDepth),
    [stockWidth, stockDepth]
  );

  return (
    <group>
      {/* Base block */}
      <mesh position={[midX, (physicalStockHeight - 0.1) / 2, midZ]} receiveShadow>
        <boxGeometry args={[stockWidth, physicalStockHeight - 0.1, stockDepth]} />
        <meshStandardMaterial color={matProps.color} roughness={matProps.roughness} metalness={matProps.metalness} transparent opacity={stockOpacity} />
        <meshStandardMaterial attach="material-2" transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Carved Surface */}
      <mesh position={[midX, physicalStockHeight, midZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry ref={geoRef} args={[stockWidth, stockDepth, 512, 512]} />
        <meshStandardMaterial
          {...matProps}
          transparent={stockOpacity < 1}
          opacity={stockOpacity}
          envMapIntensity={0.5}
        />
      </mesh>

      {/* Cut overlay */}
      {operationOverlay.hasData && (
        <lineSegments>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[operationOverlay.positions, 3]} />
            <bufferAttribute attach="attributes-color" args={[operationOverlay.colors, 3]} />
          </bufferGeometry>
          <lineBasicMaterial vertexColors transparent opacity={0.6} />
        </lineSegments>
      )}

      <ToolBit 
        position={currentPos} 
        toolType={activeOperation?.tool_type}
        toolDiameter={activeOperation?.tool_diameter}
        toolAngleDeg={activeOperation?.tool_angle_deg}
      />

      {/* Job Footprint */}
      {(() => {
        const bx0 = wcx + analysis.bbox_min[0];
        const bx1 = wcx + analysis.bbox_max[0];
        const bz0 = wcz - analysis.bbox_min[1];
        const bz1 = wcz - analysis.bbox_max[1];
        const by = physicalStockHeight + 0.2;
        return (
          <Line
            points={[[bx0, by, bz0], [bx1, by, bz0], [bx1, by, bz1], [bx0, by, bz1], [bx0, by, bz0]]}
            color="#3b82f6"
            lineWidth={2}
            transparent
            opacity={0.8}
          />
        );
      })()}

      {/* Full Toolpath Simulation */}
      {(() => {
        const pathPoints = useMemo<[number, number, number][]>(() => 
          analysis.points.map(p => [
            wcx + p.x,
            p.z + physicalStockHeight + 0.1,
            wcz - p.y
          ]), 
          [analysis.points, wcx, wcz, physicalStockHeight]
        );
        
        return (
          <Line
            points={pathPoints}
            color="#ef4444"
            lineWidth={1}
            transparent
            opacity={0.3}
            dashed
            dashScale={1}
            dashSize={2}
            gapSize={1}
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
    const stockCenter = getStockCenter(stockWidth, stockDepth);
    return new THREE.Vector3(stockCenter.x, 0, stockCenter.z);
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
        <group position={[0, -0.05, 0]}>
          <mesh position={[settings.general.bedSizeX / 2, 0, -settings.general.bedSizeY / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
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
        />

        {/* Machine Axes at bed zero (front-left corner) */}
        <group position={[0, 0.1, 0]}>
          <WCSAxes stockWidth={settings.general.bedSizeX} stockDepth={settings.general.bedSizeY} />
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
