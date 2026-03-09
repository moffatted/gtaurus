import React, { useMemo, useRef, useState, useEffect } from 'react';
import { Canvas, useLoader } from '@react-three/fiber';
import { OrbitControls, Grid, GizmoHelper, GizmoViewcube, PerspectiveCamera, Environment, Text, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useVisualizerStore, type GCodeAnalysis } from '../../stores/visualizerStore';

interface SceneProps {
  analysis: GCodeAnalysis;
  progress: number;
  stockWidth: number;
  stockDepth: number;
  midX: number;
  midZ: number;
}

function ToolBit({ position }: { position: [number, number, number] }) {
  const bitLength = 30;
  const toolRadius = 2.5;

  return (
    <group position={position}>
      {/* Spindle Body - Matching BedVisualizer Style */}
      <mesh position={[0, 45, 0]} castShadow>
        <cylinderGeometry args={[14, 14, 40, 32]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.7} />
      </mesh>
      <mesh position={[0, 20, 0]} castShadow>
        <cylinderGeometry args={[11, 12, 12, 32]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.8} />
      </mesh>
      
      {/* Collet / Nut */}
      <mesh position={[0, 14, 0]} castShadow>
        <cylinderGeometry args={[6, 7, 6, 6]} />
        <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Rotation Vanes (The Red Propeller) */}
      <group position={[0, 14, 0]}>
        <mesh rotation={[0, 0, 0]}>
          <boxGeometry args={[16, 1.5, 0.5]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} />
        </mesh>
        <mesh rotation={[0, Math.PI / 2, 0]}>
          <boxGeometry args={[16, 1.5, 0.5]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* Tool Bit */}
      <mesh position={[0, bitLength/2 - 2, 0]} castShadow>
        <cylinderGeometry args={[toolRadius, toolRadius, bitLength, 16]} />
        <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.6} />
      </mesh>

      {/* Tool Tip Glow (Always at the absolute tip) */}
      <mesh position={[0, -2, 0]}>
        <sphereGeometry args={[toolRadius + 0.5, 16, 16]} />
        <meshStandardMaterial 
          color="#ef4444" 
          emissive="#ef4444" 
          emissiveIntensity={2.0} 
          transparent 
          opacity={0.6} 
        />
      </mesh>

      <pointLight position={[0, -5, 0]} intensity={1.5} distance={50} color="#ef4444" />
    </group>
  );
}

function WCSAxes({ stockWidth, stockDepth }: { stockWidth: number, stockDepth: number }) {
  const labelSize = 8;
  const labelColor = "#cbd5e1";
  
  const xLen = Math.max(stockWidth, 200);
  const yLen = Math.max(stockDepth, 200);
  const zLen = 100;

  return (
    <group position={[0, 0, 0]}>
      {/* Origin Marker at 0,0,0 (Front Left Corner) */}
      <mesh>
        <sphereGeometry args={[2, 16, 16]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>

      {/* Axis Lines - BedVisualizer Standard (X-Red, Y-Blue, Z-Green) */}
      <Line points={[[0, 0, 0], [xLen, 0, 0]]} color="#ef4444" lineWidth={3} /> {/* X - Red */}
      <Line points={[[0, 0, 0], [0, 0, -yLen]]} color="#3b82f6" lineWidth={3} /> {/* Y - Blue (Back) */}
      <Line points={[[0, 0, 0], [0, zLen, 0]]} color="#10b981" lineWidth={2} /> {/* Z - Green (Up) */}
      
      {/* Axis Name Labels at the tips */}
      <Text position={[xLen + 15, 5, 0]} fontSize={14} color="#ef4444" rotation={[-Math.PI/2, 0, 0]}>X</Text>
      <Text position={[0, 5, -yLen - 15]} fontSize={14} color="#3b82f6" rotation={[-Math.PI/2, 0, 0]}>Y</Text>
      <Text position={[-5, zLen + 15, 0]} fontSize={14} color="#10b981">Z</Text>

      {/* Rulers - X (Right) */}
      {Array.from({ length: Math.floor(xLen / 50) + 1 }).map((_, i) => (
        <Text
          key={`x-${i}`}
          position={[i * 50, 1, 15]}
          rotation={[-Math.PI / 2, 0, 0]}
          fontSize={labelSize}
          color={labelColor}
          anchorX="center"
          anchorY="middle"
        >
          {(i * 50).toString()}
        </Text>
      ))}

      {/* Rulers - Y (Backwards) */}
      {Array.from({ length: Math.floor(yLen / 50) + 1 }).map((_, i) => (
        <Text
          key={`y-${i}`}
          position={[-15, 1, -i * 50]}
          rotation={[-Math.PI / 2, 0, Math.PI / 2]}
          fontSize={labelSize}
          color={labelColor}
          anchorX="center"
          anchorY="middle"
        >
          {(i * 50).toString()}
        </Text>
      ))}

      {/* Rulers - Z (Up) */}
      {Array.from({ length: Math.floor(zLen / 20) + 1 }).map((_, i) => (
        <Text
          key={`z-${i}`}
          position={[-15, i * 20, 0]}
          rotation={[0, Math.PI / 4, 0]}
          fontSize={labelSize}
          color={labelColor}
          anchorX="right"
          anchorY="middle"
        >
          {(i * 20).toString()}
        </Text>
      ))}
    </group>
  );
}

function CarvedStock({ analysis, progress, stockWidth, stockDepth, midX, midZ }: SceneProps) {
  const { stockOrigin } = useVisualizerStore();
  const dispCanvasRef = useRef<HTMLCanvasElement>(null);
  const aoCanvasRef = useRef<HTMLCanvasElement>(null);
  const dispTexRef = useRef<THREE.CanvasTexture | null>(null);
  const aoTexRef = useRef<THREE.CanvasTexture | null>(null);
  const [currentPos, setCurrentPos] = useState<[number, number, number]>([0, 20, 0]);

  const deepestZ = Math.abs(analysis.bbox_min[2]);
  const physicalStockHeight = Math.max(6, deepestZ + 1);
  const dispScale = -physicalStockHeight;

  const woodTexture = useLoader(THREE.TextureLoader, '/wood_texture_seamless.png');
  
  // Enhanced Wood Look - Tiling and Physical Correctness
  useEffect(() => {
    if (woodTexture) {
      woodTexture.wrapS = woodTexture.wrapT = THREE.RepeatWrapping;
      // Revert to original stretch behavior for a high-detail broad grain
      woodTexture.repeat.set(1, 1);
      woodTexture.needsUpdate = true;
    }
  }, [woodTexture, stockWidth, stockDepth]);

  const minX = analysis.bbox_min[0];
  const maxX = analysis.bbox_max[0];
  const minY = analysis.bbox_min[1];
  const maxY = analysis.bbox_max[1];
  
  const midDesignX = (minX + maxX) / 2;
  const midDesignY = (minY + maxY) / 2;

  const originX = useMemo(() => {
    if (stockOrigin === 'Center') return midDesignX;
    if (stockOrigin === 'FrontLeft' || stockOrigin === 'BackLeft') return minX;
    if (stockOrigin === 'FrontRight' || stockOrigin === 'BackRight') return maxX;
    return 0;
  }, [stockOrigin, minX, maxX, midDesignX]);

  const originY = useMemo(() => {
    if (stockOrigin === 'Center') return midDesignY;
    if (stockOrigin === 'FrontLeft' || stockOrigin === 'FrontRight') return minY;
    if (stockOrigin === 'BackLeft' || stockOrigin === 'BackRight') return maxY;
    return 0;
  }, [stockOrigin, minY, maxY, midDesignY]);

  // DRAW THE CARVE MAP
  useEffect(() => {
    if (!dispCanvasRef.current || !aoCanvasRef.current || !analysis.points.length) return;
    
    const dispCtx = dispCanvasRef.current.getContext('2d', { alpha: false });
    const aoCtx = aoCanvasRef.current.getContext('2d', { alpha: false });
    if (!dispCtx || !aoCtx) return;

    dispCtx.fillStyle = '#000000';
    dispCtx.fillRect(0, 0, 1024, 1024);
    aoCtx.fillStyle = '#ffffff';
    aoCtx.fillRect(0, 0, 1024, 1024);

    const pointLimit = Math.max(0, Math.floor(analysis.points.length * progress));
    const processedPoints = analysis.points.slice(0, pointLimit);

    if (pointLimit === 0) {
      setCurrentPos([0, physicalStockHeight + 20, 0]);
      return;
    }

    let lastX = analysis.points[0].x;
    let lastY = analysis.points[0].y;

    dispCtx.lineWidth = 45; 
    dispCtx.lineCap = 'round';
    dispCtx.lineJoin = 'round';
    aoCtx.lineWidth = 45; 
    aoCtx.lineCap = 'round';
    aoCtx.lineJoin = 'round';

    const getX = (val: number) => {
      const worldX = val - originX;
      const worldLeft = midX - stockWidth / 2;
      const canvasRel = worldX - worldLeft;
      return (canvasRel / stockWidth) * 1024;
    };
    const getY = (val: number) => {
      const worldZ = -(val - originY);
      const worldBack = midZ - stockDepth / 2;
      const canvasRel = worldZ - worldBack; 
      const relPos = canvasRel / stockDepth; 
      return (1 - relPos) * 1024;
    };

    for (let i = 0; i < processedPoints.length; i++) {
        const p = processedPoints[i];
        if (!p.is_rapid) {
            const depthVal = Math.max(0, 0 - p.z);
            const ratio = Math.min(1, depthVal / physicalStockHeight);
            const gray = Math.floor(ratio * 255);
            
            dispCtx.strokeStyle = `rgb(${gray}, ${gray}, ${gray})`;
            dispCtx.beginPath();
            dispCtx.moveTo(getX(lastX), getY(lastY));
            dispCtx.lineTo(getX(p.x), getY(p.y));
            dispCtx.stroke();

            const aoRatio = Math.min(1, ratio * 1.5);
            const aoGray = 255 - Math.floor(aoRatio * 200);
            aoCtx.strokeStyle = `rgb(${aoGray}, ${aoGray}, ${aoGray})`;
            aoCtx.beginPath();
            aoCtx.moveTo(getX(lastX), getY(lastY));
            aoCtx.lineTo(getX(p.x), getY(p.y));
            aoCtx.stroke();
        }
        lastX = p.x;
        lastY = p.y;
    }

    if (dispTexRef.current) dispTexRef.current.needsUpdate = true;
    if (aoTexRef.current) aoTexRef.current.needsUpdate = true;
    
    const lastP = processedPoints[processedPoints.length - 1];
    setCurrentPos([lastP.x - originX, lastP.z + physicalStockHeight, -(lastP.y - originY)]);
  }, [analysis, progress, stockOrigin, stockWidth, stockDepth, physicalStockHeight, midX, midZ, originX, originY]);

  const textures = useMemo(() => {
    if (typeof document === 'undefined') return { disp: null, ao: null };
    const dispTex = new THREE.CanvasTexture(document.createElement('canvas'));
    dispCanvasRef.current = dispTex.image as HTMLCanvasElement;
    dispCanvasRef.current.width = 1024;
    dispCanvasRef.current.height = 1024;
    dispTex.anisotropy = 16;
    dispTexRef.current = dispTex;

    const aoTex = new THREE.CanvasTexture(document.createElement('canvas'));
    aoCanvasRef.current = aoTex.image as HTMLCanvasElement;
    aoCanvasRef.current.width = 1024;
    aoCanvasRef.current.height = 1024;
    aoTex.anisotropy = 16;
    aoTexRef.current = aoTex;

    return { disp: dispTex, ao: aoTex };
  }, []);

  return (
    <group>
      {/* CNC Base Bed */}
      <mesh position={[0, -physicalStockHeight - 0.5, 0]} receiveShadow>
        <boxGeometry args={[1000, 1, 1000]} />
        <meshStandardMaterial color="#111" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Main Stock Mesh */}
      {/* Main Stock Mesh - Shifted Up so Bed is Y=0 */}
      <mesh position={[midX, physicalStockHeight, midZ]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <planeGeometry args={[stockWidth, stockDepth, 512, 512]} />
        <meshStandardMaterial
          map={woodTexture}
          displacementMap={textures.disp!}
          displacementScale={-physicalStockHeight * 2.0}
          aoMap={textures.ao!}
          aoMapIntensity={8.0}
          roughness={0.7}
          metalness={0.2}
        />
      </mesh>

      <mesh position={[midX, physicalStockHeight / 2 - 0.1, midZ]} receiveShadow>
        <boxGeometry args={[stockWidth, physicalStockHeight, stockDepth]} />
        <meshStandardMaterial color="#5d4037" roughness={0.9} />
      </mesh>

      <WCSAxes stockWidth={stockWidth} stockDepth={stockDepth} />
      <ToolBit position={currentPos} />
    </group>
  );
}

export function VisualizerScene() {
  const { analysis, progress, stockOrigin } = useVisualizerStore();
  
  const stockInfo = useMemo(() => {
    if (!analysis) return null;
    const designWidth = analysis.bbox_max[0] - analysis.bbox_min[0];
    const designDepth = analysis.bbox_max[1] - analysis.bbox_min[1];
    
    const padding = (stockOrigin === 'Center') ? 20 : 2;
    const stockWidth = designWidth + padding;
    const stockDepth = designDepth + padding;
    
    let midX = 0; let midZ = 0;
    if (stockOrigin === 'FrontLeft') { midX = stockWidth/2; midZ = -(stockDepth/2); }
    else if (stockOrigin === 'FrontRight') { midX = -(stockWidth/2); midZ = -(stockDepth/2); }
    else if (stockOrigin === 'BackLeft') { midX = stockWidth/2; midZ = stockDepth/2; }
    else if (stockOrigin === 'BackRight') { midX = -(stockWidth/2); midZ = stockDepth/2; }
    
    return { stockWidth, stockDepth, midX, midZ };
  }, [analysis, stockOrigin]);

  const center = useMemo(() => {
    if (!stockInfo) return new THREE.Vector3(0, 0, 0);
    return new THREE.Vector3(stockInfo.midX, 0, stockInfo.midZ);
  }, [stockInfo]);

  if (!analysis) return null;

  return (
    <Canvas 
      shadows 
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.domElement.style.background = 'radial-gradient(circle at center, #111 0%, #050505 100%)';
      }}
    >
      <PerspectiveCamera makeDefault position={[200, 250, 200]} fov={30} />
      <Environment preset="studio" />
      <ambientLight intensity={0.3} />
      <spotLight position={[500, 800, 500]} angle={0.15} penumbra={1} intensity={3} castShadow />
      <directionalLight position={[-200, 400, 200]} intensity={0.4} color="#fff" />

      <OrbitControls makeDefault enableDamping dampingFactor={0.08} target={center} />
      
      {/* Background Global Grid */}
      <Grid 
        infiniteGrid 
        fadeDistance={400} 
        sectionSize={50} 
        cellSize={10}
        sectionColor="#222"
        cellColor="#111"
        position={[0, -5.1, 0]}
      />

      <React.Suspense fallback={null}>
        {stockInfo && (
          <CarvedStock 
            analysis={analysis} 
            progress={progress}
            stockWidth={stockInfo.stockWidth}
            stockDepth={stockInfo.stockDepth}
            midX={stockInfo.midX}
            midZ={stockInfo.midZ}
          />
        )}
      </React.Suspense>

      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewcube />
      </GizmoHelper>
    </Canvas>
  );
}
