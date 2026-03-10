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
  const dispTexRef = useRef<THREE.CanvasTexture | null>(null);
  const [currentPos, setCurrentPos] = useState<[number, number, number]>([0, 20, 0]);

  const woodTexture = useLoader(THREE.TextureLoader, '/wood_texture_seamless.png');
  
  useEffect(() => {
    if (woodTexture) {
      woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
      woodTexture.repeat.set(1, 1);
      woodTexture.needsUpdate = true;
    }
  }, [woodTexture]);

  // Handle Displacement Mapping
  useEffect(() => {
    if (!dispCanvasRef.current || !analysis.points.length) return;
    
    const ctx = dispCanvasRef.current.getContext('2d', { alpha: false });
    if (!ctx) return;

    // Background is Black (Surface/0 depth)
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 1024, 1024);

    const pointLimit = Math.max(0, Math.floor(analysis.points.length * progress));
    const processedPoints = analysis.points.slice(0, pointLimit);

    if (pointLimit === 0) {
      setCurrentPos([offsetX, physicalStockHeight + 30, -offsetY]);
      return;
    }

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 2; // Soften edges for smoother displacement transitions
    ctx.shadowColor = 'white';

    const toolDiameter = 5; // Matches ToolBit radius * 2
    const pxScaleX = 1024 / stockWidth;
    const pxScaleY = 1024 / stockDepth;
    ctx.lineWidth = toolDiameter * pxScaleX; 

    const getX = (val: number) => ((val + offsetX) / stockWidth) * 1024;
    const getY = (val: number) => (1 - (val + offsetY) / stockDepth) * 1024;

    for (let i = 1; i < processedPoints.length; i++) {
        const p1 = processedPoints[i-1];
        const p2 = processedPoints[i];
        if (!p2.is_rapid && p2.z < 0) {
            const depthVal = Math.abs(p2.z);
            const ratio = Math.min(1, depthVal / physicalStockHeight);
            const grayValue = Math.floor(ratio * 255);
            
            ctx.strokeStyle = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
            ctx.beginPath();
            ctx.moveTo(getX(p1.x), getY(p1.y));
            ctx.lineTo(getX(p2.x), getY(p2.y));
            ctx.stroke();
        }
    }

    if (dispTexRef.current) dispTexRef.current.needsUpdate = true;
    
    const lastP = processedPoints.length > 0 ? processedPoints[processedPoints.length - 1] : analysis.points[0];
    // G-code Z=0 is top surface. Bit center is at Z + StockHeight + BitLength
    setCurrentPos([lastP.x + offsetX, lastP.z + physicalStockHeight + 30, -(lastP.y + offsetY)]);
  }, [analysis, progress, stockOrigin, stockWidth, stockDepth, physicalStockHeight, offsetX, offsetY]);

  const dispTex = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const tex = new THREE.CanvasTexture(canvas);
    tex.generateMipmaps = false;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    dispCanvasRef.current = canvas;
    dispTexRef.current = tex;
    return tex;
  }, []);

  const midX = stockWidth / 2;
  const midZ = -stockDepth / 2;

  return (
    <group>
      {/* Wood base block - sitting on Bed (Y=0), slightly shorter to allow surface plane on top */}
      <mesh position={[midX, (physicalStockHeight - 0.1) / 2, midZ]} receiveShadow>
        <boxGeometry args={[stockWidth - 0.2, physicalStockHeight - 0.1, stockDepth - 0.2]} />
        <meshStandardMaterial color="#5d4037" roughness={0.9} />
      </mesh>

      {/* Carved Surface - Elevated slightly (+0.05) to avoid Z-fighting with base block */}
      <mesh position={[midX, physicalStockHeight, midZ]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[stockWidth, stockDepth, 512, 512]} />
        <meshStandardMaterial
          map={woodTexture}
          displacementMap={dispTex}
          displacementScale={-physicalStockHeight} 
          displacementBias={0}
          roughness={0.7}
          metalness={0.2}
          envMapIntensity={0.5}
        />
      </mesh>

      <ToolBit position={currentPos} />


      {/* Job Footprint Bounding Box */}
      <group position={[totalOX + (analysis.bbox_min[0] + analysis.bbox_max[0])/2, physicalStockHeight + 0.1, -(totalOY + (analysis.bbox_min[1] + analysis.bbox_max[1])/2)]}>
        <mesh rotation={[-Math.PI/2, 0, 0]}>
          <planeGeometry args={[analysis.bbox_max[0] - analysis.bbox_min[0], analysis.bbox_max[1] - analysis.bbox_min[1]]} />
          <meshBasicMaterial color="#3b82f6" wireframe opacity={0.2} transparent />
        </mesh>
      </group>
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
