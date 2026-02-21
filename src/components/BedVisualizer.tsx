import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useSettingsStore } from '../stores/settingsStore';
import { useMachineStatusStore } from '../stores/machineStatusStore';
import { listen } from '@tauri-apps/api/event';

// ─── Constants ─────────────────────────────────────────────────────────────

// Mock machine dimensions (e.g., mm / 10 for scaling to a decent viewport view)
// Let's assume a 300x300mm bed
const BED_SIZE_X = 300;
const BED_SIZE_Y = 300;

// ─── Spindle Component ─────────────────────────────────────────────────────

function Spindle() {
  const spindleRef = useRef<THREE.Group>(null);
  const { machine } = useMachineStatusStore();
  
  // Note: In CNC coordinate systems usually Z is up. 
  // In Three.js: Y is up. We map CNC Z -> Three Y, CNC Y -> Three -Z
  // CNC X -> Three X

  useFrame(() => {
    if (!spindleRef.current) return;
    
    // Use Machine Position (Absolute)
    // CNC X -> Three X
    // CNC Z -> Three Y (Up)
    // CNC Y -> Three -Z (Depth)
    spindleRef.current.position.set(
      machine.x.mpos, 
      machine.z.mpos, 
      -machine.y.mpos
    );
  });

  return (
    <group ref={spindleRef}>
      {/* A simple cone pointing downwards to represent the tool */}
      <mesh position={[0, 7.5, 0]}>
        <coneGeometry args={[5, 15, 16]} />
        <meshStandardMaterial color="#3b82f6" roughness={0.4} metalness={0.8} />
      </mesh>
      {/* Visual Indicator of the tip */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

// ─── Mock Toolpath ─────────────────────────────────────────────────────────

function Toolpath() {
  // Generate a mock spiral toolpath array of Vector3 points
  const points = useMemo(() => {
    const pts = [];
    for (let i = 0; i < 100; i++) {
      const angle = 0.2 * i;
      const x = (1 + angle) * Math.cos(angle);
      const z = (1 + angle) * Math.sin(angle);
      // Let's leave Y (Z-axis in CNC) at 0 for the cut path
      pts.push(new THREE.Vector3(x, 0.5, z));
    }
    return pts;
  }, []);

  return (
    <Line
      points={points}
      color="#ef4444" 
      lineWidth={2}
      dashed={false}
    />
  );
}

// ─── Mock Autolevel Mesh ───────────────────────────────────────────────────

interface HeightMapData {
  min_x: number;
  min_y: number;
  spacing: number;
  cols: number;
  rows: number;
  grid: number[];
}

function AutolevelMesh() {
  const { settings } = useSettingsStore();
  const [mapData, setMapData] = useState<HeightMapData | null>(null);

  useEffect(() => {
    // Listen for the "autolevel:grid_update" event from the Rust backend
    const unlisten = listen<HeightMapData>('autolevel:grid_update', (event) => {
       console.log("Received new HeightMap data:", event.payload);
       setMapData(event.payload);
    });
    
    return () => {
      unlisten.then(f => f());
    };
  }, []);

  const geometry = useMemo(() => {
    if (!mapData) {
      // Create a flat dense plane representation
      const geo = new THREE.PlaneGeometry(BED_SIZE_X, BED_SIZE_Y, 20, 20);
      geo.rotateX(-Math.PI / 2);
      
      const positions = geo.attributes.position;
      const colors = new Float32Array(positions.count * 3);
      // Fill with default yellow-ish "level" color or a neutral color
      const defaultColor = new THREE.Color('#333333'); 
      for (let i = 0; i < positions.count; i++) {
         colors[i * 3] = defaultColor.r;
         colors[i * 3 + 1] = defaultColor.g;
         colors[i * 3 + 2] = defaultColor.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      
      return geo;
    }

    // Build geometry that strictly matches the heightmap bounds and resolution
    const width = (mapData.cols - 1) * mapData.spacing;
    const height = (mapData.rows - 1) * mapData.spacing;
    
    // PlaneGeometry is centered at origin. We need segments = cols-1 and rows-1
    const geo = new THREE.PlaneGeometry(width, height, mapData.cols - 1, mapData.rows - 1);
    geo.rotateX(-Math.PI / 2);
    
    // Shift it so its bottom-left is at (min_x, min_y) instead of (-width/2, -height/2)
    const offsetX = mapData.min_x + width / 2;
    const offsetZ = -(mapData.min_y + height / 2); // Invert Y for depth

    geo.translate(offsetX, 0, offsetZ);

    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    
    // Find min and max Z to normalize colors
    let minZ = 0;
    let maxZ = 0;
    if (mapData.grid.length > 0) {
        minZ = Math.min(...mapData.grid);
        maxZ = Math.max(...mapData.grid);
    }
    // Prevent division by zero if completely flat
    if (Math.abs(maxZ - minZ) < 0.001) {
        maxZ = 1.0;
        minZ = -1.0;
    }

    const highColor = new THREE.Color('#ef4444'); // Red
    const levelColor = new THREE.Color('#eab308'); // Yellow
    const lowColor = new THREE.Color('#3b82f6'); // Blue
    const tempColor = new THREE.Color();
    
    // Map the 1D grid array to the vertices
    // ThreeJS PlaneGeometry vertices order: top-to-bottom, left-to-right
    // Our HeightMap grid order: Y=min_y to max_y (bottom-to-top), X=min_x to max_x (left-to-right)
    for (let r = 0; r < mapData.rows; r++) {
      for (let c = 0; c < mapData.cols; c++) {
         // ThreeJS vertex index from top-left
         const threeR = (mapData.rows - 1) - r; 
         const vIdx = threeR * mapData.cols + c;
         
         // HeightMap index from bottom-left
         const hmIdx = r * mapData.cols + c;
         const zValue = mapData.grid[hmIdx];
         
         positions.setY(vIdx, zValue);

         // Determine color based on height relative to zero
         if (zValue >= 0) {
             const t = Math.min(zValue / Math.max(maxZ, 0.001), 1.0);
             tempColor.lerpColors(levelColor, highColor, t);
         } else {
             const t = Math.min(Math.abs(zValue) / Math.abs(Math.min(minZ, -0.001)), 1.0);
             tempColor.lerpColors(levelColor, lowColor, t);
         }

         colors[vIdx * 3] = tempColor.r;
         colors[vIdx * 3 + 1] = tempColor.g;
         colors[vIdx * 3 + 2] = tempColor.b;
      }
    }
    
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [mapData]);

  if (!settings.showAutolevelMesh) return null;

  return (
    <mesh geometry={geometry} position={[0, -0.1, 0]}>
      <meshStandardMaterial 
        vertexColors={true}
        wireframe={true} 
        transparent 
        opacity={0.6} 
      />
    </mesh>
  );
}

// ─── Main Visualizer ───────────────────────────────────────────────────────

export function BedVisualizer() {
  const { machine } = useMachineStatusStore();
  return (
    <div className="w-full h-full bg-[var(--bg-secondary)] overflow-hidden relative rounded-bl-lg rounded-br-lg">
      <Canvas 
        camera={{ position: [200, 150, 200], fov: 45 }}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Environment setup */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[100, 200, 100]} intensity={1} castShadow />
        
        {/* Interactive Controls */}
        <OrbitControls 
          makeDefault 
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.05}
          target={[150, 0, -150]} // Focus on the center of the 300x300 bed
        />

        {/* Global coordinate axes (length = 50) */}
        <axesHelper args={[100]} />

        {/* Grid representing the bed limits */}
        <Grid 
          args={[BED_SIZE_X, BED_SIZE_Y]} 
          position={[150, 0, -150]}
          cellSize={10} 
          cellThickness={1} 
          cellColor="#6b7280" 
          sectionSize={50} 
          sectionThickness={1.5} 
          sectionColor="#9ca3af" 
          fadeDistance={400} 
        />

        {/* Dynamic elements */}
        <Toolpath />
        <AutolevelMesh />
        <Spindle />
      </Canvas>
      
      {/* Quick HUD overlay for context */}
      <div className="absolute top-4 left-4 pointer-events-none bg-[var(--bg-tertiary)]/80 backdrop-blur-sm border border-[var(--border-color)] px-3 py-2 rounded-lg shadow-sm">
        <h3 className="text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wider mb-1">Live View</h3>
        <div className="flex flex-col gap-0.5 text-xs font-mono text-[var(--text-secondary)]">
           <span>Bed Size: {BED_SIZE_X}x{BED_SIZE_Y}mm</span>
           <div className="mt-2 pt-2 border-t border-[var(--border-color)] space-y-1">
             <div className="flex justify-between gap-4">
                <span className="text-[var(--text-tertiary)]">MPos X:</span>
                <span className="text-[var(--accent-primary)]">{machine.x.mpos.toFixed(2)}</span>
             </div>
             <div className="flex justify-between gap-4">
                <span className="text-[var(--text-tertiary)]">MPos Y:</span>
                <span className="text-[var(--accent-primary)]">{machine.y.mpos.toFixed(2)}</span>
             </div>
             <div className="flex justify-between gap-4">
                <span className="text-[var(--text-tertiary)]">MPos Z:</span>
                <span className="text-[var(--accent-primary)]">{machine.z.mpos.toFixed(2)}</span>
             </div>
           </div>
           <div className="flex items-center gap-1.5 mt-2 opacity-50">
             <div className="w-2 h-2 rounded-full bg-red-400" /> X Axis
           </div>
           <div className="flex items-center gap-1.5 opacity-50">
             <div className="w-2 h-2 rounded-full bg-green-400" /> Y Axis
           </div>
           <div className="flex items-center gap-1.5 opacity-50">
             <div className="w-2 h-2 rounded-full bg-blue-400" /> Z Axis
           </div>
        </div>
      </div>
    </div>
  );
}
