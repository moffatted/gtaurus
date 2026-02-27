import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line, GizmoHelper, GizmoViewcube } from '@react-three/drei';
import { Plus, Minus, Trash } from 'lucide-react';
import * as THREE from 'three';
import { useSettingsStore } from '../stores/settingsStore';
import { useMachineStatusStore } from '../stores/machineStatusStore';
import { useGcodeStore } from '../stores/gcodeStore';
import { useToolStore } from '../stores/toolStore';
import { useThemeStore } from '../stores/themeStore';
import { useMeshStore, type HeightMapData } from '../stores/meshStore';
import { Tooltip } from './ui/Tooltip';
import { transport } from '../services/transportService';

// ─── Spindle Component ─────────────────────────────────────────────────────

function Spindle() {
  const spindleRef = useRef<THREE.Group>(null);
  const rotatingPartsRef = useRef<THREE.Group>(null);
  const blurRef = useRef<THREE.Mesh>(null);
  const sparksRef = useRef<THREE.Group>(null);
  
  const bedSizeZ = useSettingsStore(state => state.settings.general.bedSizeZ);
  
  // Get tool diameter
  const activeToolId = useToolStore(state => state.activeToolId);
  const tools = useToolStore(state => state.tools);
  const activeTool = useMemo(() => tools.find(t => t.id === activeToolId), [tools, activeToolId]);
  
  // Visual Scaling: Make it beefier for visibility
  const toolRadius = ((activeTool?.diameter || 3.175) / 2) * 1.5; 
  const bitLength = 30;

  // Initialize sparks once - increased radius for top-down visibility
  const sparks = useMemo(() => {
    return Array.from({ length: 12 }).map((_, i) => ({
      angle: (i / 12) * Math.PI * 2,
      radius: 18 + Math.random() * 6, // Moved outside the spindle body (r=14)
      speed: 0.8 + Math.random() * 2.5,
      offset: Math.random() * Math.PI * 2
    }));
  }, []);

  useFrame(({ clock }, delta) => {
    if (!spindleRef.current) return;
    
    // Get non-reactive state for frame updates
    const gcodeState = useGcodeStore.getState();
    const statusState = useMachineStatusStore.getState();
    const machine = statusState.machine;
    const isSimulating = gcodeState.isSimulating;
    const simPos = gcodeState.simPos;
    
    // 1. Position Update
    let tx = machine.x.mpos;
    let ty = machine.y.mpos;
    let tz = machine.z.mpos;

    if (isSimulating && simPos) {
      tx = simPos.x;
      ty = simPos.y;
      tz = simPos.z;
    }

    // Three.js Coordinate Mapping
    spindleRef.current.position.x = THREE.MathUtils.lerp(spindleRef.current.position.x, tx, 1 - Math.exp(-20 * delta));
    spindleRef.current.position.y = THREE.MathUtils.lerp(spindleRef.current.position.y, tz + bedSizeZ, 1 - Math.exp(-20 * delta));
    spindleRef.current.position.z = THREE.MathUtils.lerp(spindleRef.current.position.z, -ty, 1 - Math.exp(-20 * delta));

    // 2. Rotation & Sparks Animation
    const isRealOn = !!(machine.isSpindleActive || machine.spindle > 0 || machine.status === 'Run');
    const isSimOn = (isSimulating && simPos) ? !simPos.isRapid : false;
    const isEnergized = !!(isRealOn || isSimOn);

    if (machine.spindle > 0) {
        // Just for debugging - verify the state is reaching the component
        // console.log("[BedVisualizer] Spindle active:", machine.spindle, "isEnergized:", isEnergized);
    }

    if (rotatingPartsRef.current) {
        if (isEnergized) {
            const rpm = (machine.spindle > 100) ? machine.spindle : 1200;
            const radPerSec = (rpm / 60) * Math.PI * 2;
            rotatingPartsRef.current.rotation.y += radPerSec * delta;

            if (blurRef.current) {
                blurRef.current.visible = true;
                const intensity = Math.min(rpm / 5000, 1.0); 
                blurRef.current.scale.set(1 + intensity * 0.3, 1, 1 + intensity * 0.3);
                (blurRef.current.material as THREE.MeshStandardMaterial).opacity = intensity * 0.25;
            }
        } else {
            if (blurRef.current) blurRef.current.visible = false;
        }
    }

    // 3. Sparks Logic
    if (sparksRef.current) {
        sparksRef.current.visible = isEnergized;
        if (isEnergized) {
            const t = clock.getElapsedTime();
            sparksRef.current.children.forEach((child, i) => {
                const s = sparks[i];
                // More aggressive vertical dance and flickering
                const flicker = Math.sin(t * 30 + s.offset) * 0.5 + 0.5;
                child.position.y = 10 + Math.sin(t * 20 * s.speed) * 8;
                child.scale.setScalar(0.8 + flicker * 1.5);
                (child as any).material.opacity = 0.4 + flicker * 0.6;
                (child as any).material.emissiveIntensity = 2 + flicker * 10;
            });
        }
    }
  });

  return (
    <group ref={spindleRef}>
      {/* Spindle Body - Large static mounting bracket/motor housing */}
      <mesh position={[0, 45, 0]} castShadow>
        <cylinderGeometry args={[14, 14, 40, 32]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.7} />
      </mesh>
      <mesh position={[0, 20, 0]} castShadow>
        <cylinderGeometry args={[11, 12, 12, 32]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.3} metalness={0.8} />
      </mesh>
      
      {/* Rotating Mechanical Assembly */}
      <group ref={rotatingPartsRef}>
        {/* Collet / Nut */}
        <mesh position={[0, 14, 0]} castShadow>
          <cylinderGeometry args={[6, 7, 6, 6]} />
          <meshStandardMaterial color="#cbd5e1" roughness={0.2} metalness={0.9} />
        </mesh>

        {/* Rotation Vanes (The "Propeller" to make movement indisputable) */}
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

        {/* Longer Tool Bit */}
        <mesh position={[0, bitLength/2 - 2, 0]} castShadow>
          <cylinderGeometry args={[toolRadius, toolRadius, bitLength, 16]} />
          <meshStandardMaterial color="#64748b" roughness={0.4} metalness={0.6} />
        </mesh>

        {/* High-speed Blur Disk */}
        <mesh ref={blurRef} position={[0, 14, 0]} visible={false}>
          <cylinderGeometry args={[10, 10, 2, 32]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.2} />
        </mesh>
      </group>

      {/* Sparks Group - Energized Indication */}
      <group ref={sparksRef} visible={false}>
        {sparks.map((s, i) => (
          <mesh 
            key={i} 
            position={[Math.cos(s.angle) * s.radius, 14, Math.sin(s.angle) * s.radius]}
          >
            <sphereGeometry args={[1.5, 8, 8]} />
            <meshStandardMaterial 
              color="#fbbf24" 
              emissive="#fbbf24" 
              emissiveIntensity={8} 
              transparent 
              opacity={0.8} 
            />
          </mesh>
        ))}
      </group>

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

// ─── Autolevel Mesh ───────────────────────────────────────────────────

function AutolevelMesh() {
  const { settings } = useSettingsStore();
  const { mapData, setMapData } = useMeshStore();

  useEffect(() => {
    // Listen for the "autolevel:grid_update" event from the Rust backend
    const unlisten = transport.listen<HeightMapData>('autolevel:grid_update', (event: any) => {
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
      geo.translate(settings.general.bedSizeX / 2, 0, -settings.general.bedSizeY / 2);
      
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
    pvc:      { color: "#f8fafc", metalness: 0.1, roughness: 0.5 },
    pcb:      { color: "#b87333", metalness: 0.9, roughness: 0.2, emissive: "#4a2311" }
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
        followCamera={false}
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
  const theme = useThemeStore(state => state.theme);
  const clearSimulation = useGcodeStore(state => state.clearSimulation);
  const controlsRef = useRef<any>(null);

  const handleZoom = (direction: 'in' | 'out') => {
    if (controlsRef.current) {
      const scale = direction === 'in' ? 0.8 : 1.2;
      const camera = controlsRef.current.object;
      const target = controlsRef.current.target;

      if (camera.isPerspectiveCamera) {
        // Move camera closer/further along the vector to the target
        const offset = new THREE.Vector3().subVectors(camera.position, target);
        offset.multiplyScalar(scale);
        camera.position.addVectors(target, offset);
      } else {
        // For orthographic camera
        camera.zoom /= scale;
        camera.updateProjectionMatrix();
      }
    }
  };
  return (
    <div className="w-full h-full bg-[var(--bg-secondary)] overflow-hidden relative rounded-bl-lg rounded-br-lg">
      <Canvas 
        shadows 
        camera={{ position: [300, 300, 300], fov: 45 }}
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
          ref={controlsRef}
          makeDefault 
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2 - 0.05}
          target={[settings.general.bedSizeX / 2, 0, -settings.general.bedSizeY / 2]} 
        />

        <GizmoHelper
          alignment="top-right"
          margin={[60, 60]}
        >
          <GizmoViewcube 
            opacity={1}
            color={theme === 'dark' ? "#334155" : "#e2e8f0"}
            strokeColor={theme === 'dark' ? "#cbd5e1" : "#475569"}
            textColor={theme === 'dark' ? "#f8fafc" : "#0f172a"}
            hoverColor="rgba(59, 130, 246, 0.5)"
            font="bold 24px Inter, sans-serif"
          />
        </GizmoHelper>

        <SceneContent />
      </Canvas>

      {/* Zoom Controls */}
      <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 z-10">
        <Tooltip content="Zoom In" position="right">
          <button 
            onClick={() => handleZoom('in')}
            className="p-1.5 bg-[var(--bg-tertiary)]/90 backdrop-blur-sm border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip content="Zoom Out" position="right">
          <button 
            onClick={() => handleZoom('out')}
            className="p-1.5 bg-[var(--bg-tertiary)]/90 backdrop-blur-sm border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] rounded-lg shadow-sm transition-all"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      </div>
      
      {/* Quick HUD overlay - Now moved to the bottom horizontal bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none bg-[var(--bg-tertiary)]/80 backdrop-blur-md border border-[var(--border-color)] px-4 py-2 rounded-xl shadow-lg flex items-center gap-6 z-10 transition-all max-w-[calc(100%-140px)] overflow-hidden">
        <div className="flex flex-col border-r border-[var(--border-color)]/30 pr-4 shrink-0">
          <h3 className="text-[9px] font-bold text-[var(--accent-primary)] uppercase tracking-widest leading-tight">Live View</h3>
          <span className="text-[9px] font-mono text-[var(--text-tertiary)] whitespace-nowrap">{settings.general.bedSizeX}×{settings.general.bedSizeY}mm</span>
        </div>

        <div className="flex items-center gap-5 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase">X</span>
            <span className="text-xs font-mono font-bold text-[var(--text-primary)] min-w-[50px]">{machine.x.mpos.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase">Y</span>
            <span className="text-xs font-mono font-bold text-[var(--text-primary)] min-w-[50px]">{machine.y.mpos.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase">Z</span>
            <span className="text-xs font-mono font-bold text-[var(--accent-primary)] min-w-[50px]">{machine.z.mpos.toFixed(2)}</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-3 border-l border-[var(--border-color)]/30 pl-4 shrink-0">
           <div className="flex items-center gap-1.5">
             <div className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
             <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase font-mono">X</span>
           </div>
           <div className="flex items-center gap-1.5">
             <div className="w-2.5 h-2.5 rounded-full bg-blue-500/80" />
             <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase font-mono">Y</span>
           </div>
           <div className="flex items-center gap-1.5">
             <div className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
             <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase font-mono">Z</span>
           </div>
        </div>
      </div>

      {/* Clear Toolpath Button */}
      <div className="absolute bottom-4 right-4 z-10">
        <Tooltip content="Clear Simulated Path" position="left">
          <button 
            onClick={clearSimulation}
            className="p-1.5 bg-[var(--bg-tertiary)]/90 backdrop-blur-sm border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 rounded-lg shadow-sm transition-all"
          >
            <Trash className="w-4 h-4" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
