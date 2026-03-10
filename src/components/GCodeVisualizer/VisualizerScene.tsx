import { useMemo, useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, GizmoHelper, GizmoViewcube, PerspectiveCamera, Environment, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useVisualizerStore, type GCodeAnalysis } from '../../stores/visualizerStore';
import { useSettingsStore } from '../../stores/settingsStore';

function ToolBit({ position }: { position: [number, number, number] }) {
  const bitLength = 30;
  const toolRadius = 2.5;

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
      
      {/* Tool Bit */}
      <mesh position={[0, -bitLength / 2, 0]} castShadow>
        <cylinderGeometry args={[toolRadius, toolRadius, bitLength, 32]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.8} />
      </mesh>
      
      {/* Pointy Tip */}
      <mesh position={[0, -bitLength, 0]} castShadow>
        <sphereGeometry args={[toolRadius, 16, 16]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.8} />
      </mesh>

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
  progress, 
  offsetX, 
  offsetY,
  stockOrigin 
}: { 
  analysis: GCodeAnalysis; 
  progress: number;
  offsetX: number;
  offsetY: number;
  stockOrigin: string;
}) {
  const { settings } = useSettingsStore();
  const { 
    width: stockWidth, 
    height: stockDepth, 
    thickness: physicalStockHeight
  } = settings.stock;

  const totalOX = offsetX;
  const totalOY = offsetY;
  
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

    const pointLimit = Math.max(0, Math.floor(analysis.points.length * progress));
    const processedPoints = analysis.points.slice(0, pointLimit);

    if (pointLimit > 0) {
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round'; 
      
      const toolDiameter = 5;
      const pxScaleX = 1024 / stockWidth;
      ctx.lineWidth = toolDiameter * pxScaleX; 

      const getX = (val: number) => ((val + offsetX) / stockWidth) * 1024;
      const getY = (val: number) => (1 - (val + offsetY) / stockDepth) * 1024;

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
    setCurrentPos([lastP.x + offsetX, lastP.z + physicalStockHeight + 30, -(lastP.y + offsetY)]);
  }, [analysis, progress, stockOrigin, stockWidth, stockDepth, physicalStockHeight, offsetX, offsetY]);

  useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    dispCanvasRef.current = canvas;
    return canvas;
  }, []);

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

      <ToolBit position={currentPos} />


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
  const { analysis, progress, stockOrigin } = useVisualizerStore();
  const { settings } = useSettingsStore();
  
  const stockWidth = settings.stock.width;
  const stockDepth = settings.stock.height;


  const center = useMemo(() => {
    // The camera target should be the center of the stock, not the G-code origin.
    return new THREE.Vector3(stockWidth / 2, 0, -stockDepth / 2);
  }, [stockWidth, stockDepth]);

  if (!analysis) return null;

  return (
    <Canvas 
      shadows 
      gl={{ antialias: true, logarithmicDepthBuffer: true }}
      className="w-full h-full cursor-move"
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
          progress={progress} 
          offsetX={settings.stock.offsetX}
          offsetY={settings.stock.offsetY}
          stockOrigin={stockOrigin}
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
  );
}
