import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useSettingsStore } from '../stores/settingsStore';

// ─── Constants ─────────────────────────────────────────────────────────────

// Mock machine dimensions (e.g., mm / 10 for scaling to a decent viewport view)
// Let's assume a 300x300mm bed
const BED_SIZE_X = 300;
const BED_SIZE_Y = 300;

// ─── Spindle Component ─────────────────────────────────────────────────────

function Spindle() {
  const spindleRef = useRef<THREE.Mesh>(null);
  
  // Simulate movement using useFrame
  useFrame(({ clock }) => {
    if (!spindleRef.current) return;
    const t = clock.getElapsedTime() * 0.5; // Speed multiplier
    
    // Simulate drawing a circle-ish path overlapping the bed
    const x = Math.sin(t) * 100; // Radius 100
    const y = Math.max(10, Math.sin(t * 3) * 20 + 20); // Bounce Z height (mapped to Y in ThreeJS)
    const z = Math.cos(t) * 100;
    
    // Note: In CNC coordinate systems usually Z is up. 
    // In Three.js: Y is up. We map CNC Z -> Three Y, CNC Y -> Three -Z
    spindleRef.current.position.set(x, y, z);
  });

  return (
    <mesh ref={spindleRef}>
      {/* A simple cone pointing downwards to represent the tool */}
      <coneGeometry args={[5, 15, 16]} />
      {/* Shift cone geometry up so its tip is exactly at the position coordinate */}
      <meshStandardMaterial color="#3b82f6" roughness={0.4} metalness={0.8} />
      {/* Center offset */}
      <group position={[0, 7.5, 0]}> 
        <mesh>
          <coneGeometry args={[5, 15, 16]} />
          <meshStandardMaterial color="#3b82f6" roughness={0.4} metalness={0.8} />
        </mesh>
      </group>
    </mesh>
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

function AutolevelMesh() {
  const { settings } = useSettingsStore();

  const geometry = useMemo(() => {
    // Create a dense plane representation of the bed
    const geo = new THREE.PlaneGeometry(BED_SIZE_X, BED_SIZE_Y, 20, 20);
    // Rotate the plane to lay flat (XZ plane)
    geo.rotateX(-Math.PI / 2);
    
    // Add some "warp" to the vertices to mock an uneven bed
    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i); // Represents Y in CNC
      // Calculate a slight warp (e.g., bowl shaped with noise)
      // Map Y up/down
      const warp = Math.sin(x * 0.05) * Math.cos(z * 0.05) * 5; 
      positions.setY(i, warp);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  if (!settings.showAutolevelMesh) return null;

  return (
    <mesh geometry={geometry} position={[0, -0.1, 0]}>
      <meshStandardMaterial 
        color="#a855f7" 
        wireframe={true} 
        transparent 
        opacity={0.3} 
      />
    </mesh>
  );
}

// ─── Main Visualizer ───────────────────────────────────────────────────────

export function BedVisualizer() {
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
          maxPolarAngle={Math.PI / 2 - 0.05} // Prevent camera from going completely under the bed
        />

        {/* Global coordinate axes (length = 50) */}
        <axesHelper args={[50]} />

        {/* Grid representing the bed limits */}
        <Grid 
          args={[BED_SIZE_X, BED_SIZE_Y]} 
          position={[0, 0, 0]}
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
           <div className="flex items-center gap-1.5 mt-1">
             <div className="w-2 h-2 rounded-full bg-red-400" /> X Axis
           </div>
           <div className="flex items-center gap-1.5">
             <div className="w-2 h-2 rounded-full bg-green-400" /> Y Axis
           </div>
           <div className="flex items-center gap-1.5">
             <div className="w-2 h-2 rounded-full bg-blue-400" /> Z Axis
           </div>
        </div>
      </div>
    </div>
  );
}
