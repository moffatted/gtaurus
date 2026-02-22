import { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line } from '@react-three/drei';
import * as THREE from 'three';
import { useSettingsStore } from '../stores/settingsStore';
import { useMachineStatusStore } from '../stores/machineStatusStore';
import { listen } from '@tauri-apps/api/event';
import { useGcodeStore } from '../stores/gcodeStore';
import { useToolStore } from '../stores/toolStore';

// ─── Spindle Component ─────────────────────────────────────────────────────

function Spindle() {
  const spindleRef = useRef<THREE.Group>(null);
  const bedSizeZ = useSettingsStore(state => state.settings.general.bedSizeZ);
  
  // Get tool diameter
  const activeToolId = useToolStore(state => state.activeToolId);
  const tools = useToolStore(state => state.tools);
  const activeTool = useMemo(() => tools.find(t => t.id === activeToolId), [tools, activeToolId]);
  const toolRadius = (activeTool?.diameter || 3.175) / 2;

  useFrame((_, delta) => {
    if (!spindleRef.current) return;
    
    const { isSimulating, simPos } = useGcodeStore.getState();
    const { machine } = useMachineStatusStore.getState();
    
    let tx = machine.x.mpos;
    let ty = machine.y.mpos;
    let tz = machine.z.mpos;

    if (isSimulating && simPos) {
      tx = simPos.x;
      ty = simPos.y;
      tz = simPos.z;
    }

    const targetX = tx;
    const targetY = tz + bedSizeZ; 
    const targetZ = -ty;

    const lerpSpeed = isSimulating ? 25 : 15;
    const t = 1 - Math.exp(-lerpSpeed * delta);
    
    spindleRef.current.position.x = THREE.MathUtils.lerp(spindleRef.current.position.x, targetX, t);
    spindleRef.current.position.y = THREE.MathUtils.lerp(spindleRef.current.position.y, targetY, t);
    spindleRef.current.position.z = THREE.MathUtils.lerp(spindleRef.current.position.z, targetZ, t);
  });

  return (
    <group ref={spindleRef}>
      {/* Spindle Body - Sleek Metallic Silver */}
      <group rotation={[Math.PI, 0, 0]}>
        <mesh position={[0, -15, 0]} castShadow>
          <cylinderGeometry args={[12, 11, 25, 32]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} metalness={0.6} />
        </mesh>
      </group>
      
      {/* Collet / Nut - Polished Steel */}
      <mesh position={[0, 4, 0]} castShadow>
        <cylinderGeometry args={[5, 6, 4, 6]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* "Tool Bit" Cylinder - Tungsten/Carbide Metal */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[toolRadius, toolRadius, 10, 16]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.4} metalness={0.5} />
      </mesh>

      {/* Tool Tip Glow */}
      <mesh position={[0, -3.5, 0]}>
        <sphereGeometry args={[toolRadius + 0.2, 16, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={1} transparent opacity={0.6} />
      </mesh>
    </group>
  );
}

// ─── Toolpath Components ───────────────────────────────────────────────────


function Toolpath() {
  const simulatedPath = useGcodeStore(state => state.simulatedPath);
  const actualPath = useGcodeStore(state => state.actualPath);

  const bedSizeZ = useSettingsStore(state => state.settings.general.bedSizeZ);

  // Convert GcodePoint to THREE.Vector3 array for Drei Line
  // CNC X -> Three X
  // CNC Y -> Three -Z
  // CNC Z -> Three Y (Offset)
  const simPoints = useMemo(() => 
    simulatedPath.map(p => new THREE.Vector3(p.x, p.z + bedSizeZ, -p.y)), 
  [simulatedPath, bedSizeZ]);

  const actPoints = useMemo(() => 
    actualPath.map(p => new THREE.Vector3(p.x, p.z + bedSizeZ, -p.y)), 
  [actualPath, bedSizeZ]);

  return (
    <group>
      {/* Simulation Path (Dashed) */}
      {simPoints.length > 1 && (
        <Line
          points={simPoints}
          color="#ef4444" // Red
          lineWidth={1.5}
          dashed
          dashSize={5}
          gapSize={3}
          opacity={0.5}
          transparent
        />
      )}

      {/* Actual Cut Path (Solid) */}
      {actPoints.length > 1 && (
        <Line
          points={actPoints}
          color="#10b981" // Emerald Green
          lineWidth={2.5}
        />
      )}
    </group>
  );
}

/**
 * Monitors machine position and adds to the actual path in the store
 */
function RealtimePathTracker() {
  const addActualPoint = useGcodeStore(state => state.addActualPoint);
  const recordUsage = useToolStore(state => state.recordUsage);
  const activeToolId = useToolStore(state => state.activeToolId);
  
  const lastPosRef = useRef<{x: number, y: number, z: number} | null>(null);
  const accumulatedTimeRef = useRef(0);
  const accumulatedDistRef = useRef(0);

  useFrame((_, delta) => {
    const machine = useMachineStatusStore.getState().machine;
    const isRunning = machine.status === 'Run' || machine.status === 'Jog' || machine.status === 'Home';
    
    if (isRunning) {
      const curPos = { x: machine.x.mpos, y: machine.y.mpos, z: machine.z.mpos };
      
      // 1. Path Tracking
      addActualPoint({
        ...curPos,
        isRapid: false
      });

      // 2. Usage Tracking (only if there's an active tool)
      if (activeToolId) {
          accumulatedTimeRef.current += delta;
          
          if (lastPosRef.current) {
              const dx = curPos.x - lastPosRef.current.x;
              const dy = curPos.y - lastPosRef.current.y;
              const dz = curPos.z - lastPosRef.current.z;
              const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
              accumulatedDistRef.current += dist;
          }

          // Commit to store periodically (every 2 seconds) to avoid overhead
          if (accumulatedTimeRef.current >= 2) {
              recordUsage(activeToolId, accumulatedTimeRef.current, accumulatedDistRef.current);
              accumulatedTimeRef.current = 0;
              accumulatedDistRef.current = 0;
          }
      }
      lastPosRef.current = curPos;
    } else {
        lastPosRef.current = null;
    }
  });

  return null;
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
      const geo = new THREE.PlaneGeometry(settings.general.bedSizeX, settings.general.bedSizeY, 20, 20);
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

function StockMesh() {
  const stock = useSettingsStore(state => state.settings.stock);

  if (!stock.enabled) return null;

  // Material property mapping for a more premium feel
  const materialProfiles: Record<string, { color: string; metalness: number; roughness: number; emissive?: string }> = {
    pine:     { color: "#f3d299", metalness: 0.0, roughness: 0.8 },
    mdf:      { color: "#b58d5a", metalness: 0.0, roughness: 0.9 },
    aluminum: { color: "#cbd5e1", metalness: 0.8, roughness: 0.2, emissive: "#1e293b" },
    pvc:      { color: "#f8fafc", metalness: 0.1, roughness: 0.5 }
  };

  const profile = materialProfiles[stock.material] || materialProfiles.pine;

  // CNC -> Three.js Mapping
  // CNC X -> Three X
  // CNC Y -> Three -Z
  // CNC Z -> Three Y (Up)
  
  const width = Math.max(stock.width, 1);
  const thickness = Math.max(stock.thickness, 1);
  const depth = Math.max(stock.height, 1);

  const posX = stock.offsetX + width / 2;
  const posY = thickness / 2; 
  const posZ = -(stock.offsetY + depth / 2);

  return (
    <group position={[posX, posY, posZ]}>
      {/* Main Volume */}
      <mesh receiveShadow castShadow>
        <boxGeometry args={[width, thickness, depth]} />
        <meshStandardMaterial 
          color={profile.color}
          transparent
          opacity={stock.opacity}
          roughness={profile.roughness}
          metalness={profile.metalness}
          emissive={profile.emissive}
          emissiveIntensity={profile.emissive ? 0.2 : 0}
        />
      </mesh>
      
      {/* Edges / Wireframe (Always slightly more opaque for definition) */}
      <mesh>
        <boxGeometry args={[width + 0.2, thickness + 0.2, depth + 0.2]} />
        <meshStandardMaterial 
          color={profile.color} 
          wireframe 
          transparent 
          opacity={Math.min(stock.opacity + 0.2, 1.0)} 
          depthWrite={false}
        />
      </mesh>
      
      {/* Corner indicator (bottom left of stock) */}
      <mesh position={[-width / 2, -thickness / 2, depth / 2]}>
        <sphereGeometry args={[2, 8, 8]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>
    </group>
  );
}

// ─── Machine Bed & Limits ──────────────────────────────────────────────────

function MachineBed() {
  const bedX = useSettingsStore(state => state.settings.general.bedSizeX);
  const bedY = useSettingsStore(state => state.settings.general.bedSizeY);

  return (
    <group>
      {/* Physical Bed Plate */}
      <mesh position={[bedX / 2, -1, -bedY / 2]} receiveShadow>
        <boxGeometry args={[bedX, 2, bedY]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} metalness={0.1} />
      </mesh>

      {/* Grid on top of the plate */}
      <Grid 
        args={[bedX, bedY]} 
        position={[bedX / 2, 0.05, -bedY / 2]}
        cellSize={10} 
        cellThickness={1} 
        cellColor="#334155" 
        sectionSize={50} 
        sectionThickness={1.5} 
        sectionColor="#475569" 
        fadeDistance={500}
        infiniteGrid={false}
      />

      {/* Origin Axis Labels */}
      <group position={[0, 0, 0]}>
        {/* X Axis Label */}
        <Line points={[[0, 0, 0], [50, 0, 0]]} color="#ef4444" lineWidth={2} />
        {/* Y Axis Label (mapped to -Z) */}
        <Line points={[[0, 0, 0], [0, 0, -50]]} color="#3b82f6" lineWidth={2} />
        {/* Z Axis Label */}
        <Line points={[[0, 0, 0], [0, 50, 0]]} color="#10b981" lineWidth={2} />
      </group>
    </group>
  );
}

function SceneContent() {
  const { settings } = useSettingsStore();

  return (
    <>
      <Spindle />
      <Toolpath />
      <StockMesh />
      <MachineBed />
      <RealtimePathTracker />
      {settings.showAutolevelMesh && <AutolevelMesh />}
      
      {/* Machine Origin (0,0,0) Marker */}
      <group position={[0, 0, 0]}>
        <mesh>
          <sphereGeometry args={[2, 16, 16]} />
          <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={0.5} />
        </mesh>
      </group>
    </>
  );
}

// ─── Main Visualizer ───────────────────────────────────────────────────────

export function BedVisualizer() {
  const { machine } = useMachineStatusStore();
  const { settings } = useSettingsStore();
  return (
    <div className="w-full h-full bg-[var(--bg-secondary)] overflow-hidden relative rounded-bl-lg rounded-br-lg">
      <Canvas 
        shadows 
        camera={{ position: [200, 200, 200], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%' }}
      >
        <color attach="background" args={['#0f172a']} />
        
        <ambientLight intensity={0.4} />
        <hemisphereLight intensity={0.5} groundColor="#000000" />
        <directionalLight 
          position={[100, 150, 100]} 
          intensity={1.5} 
          castShadow 
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-100, 100, -100]} intensity={0.6} />
        
        <OrbitControls 
          makeDefault 
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.05}
          target={[settings.general.bedSizeX / 4, 0, -settings.general.bedSizeY / 4]} 
        />

        <SceneContent />
      </Canvas>
      
      {/* Quick HUD overlay for context */}
      <div className="absolute top-4 left-4 pointer-events-none bg-[var(--bg-tertiary)]/80 backdrop-blur-sm border border-[var(--border-color)] px-3 py-2 rounded-lg shadow-sm">
        <h3 className="text-xs font-semibold text-[var(--accent-primary)] uppercase tracking-wider mb-1">Live View</h3>
        <div className="flex flex-col gap-0.5 text-xs font-mono text-[var(--text-secondary)]">
           <span>Bed Size: {settings.general.bedSizeX}x{settings.general.bedSizeY}mm</span>
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
           <div className="flex items-center gap-1.5 mt-2 opacity-80">
             <div className="w-2 h-2 rounded-full bg-red-500" /> X Axis (Right)
           </div>
           <div className="flex items-center gap-1.5 opacity-80">
             <div className="w-2 h-2 rounded-full bg-blue-500" /> Y Axis (Rear)
           </div>
           <div className="flex items-center gap-1.5 opacity-80">
             <div className="w-2 h-2 rounded-full bg-green-500" /> Z Axis (Up)
           </div>
        </div>
      </div>
    </div>
  );
}
