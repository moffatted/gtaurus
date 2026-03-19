/**
 * @file BedVisualizer.tsx
 * @purpose 3D visualization component for the machine bed, G-code path, and real-time machine position.
 */
import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Line, GizmoHelper, GizmoViewcube, Text } from '@react-three/drei';
import { Plus, Minus, Eraser, FileX, Hexagon } from 'lucide-react';
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
  const stock = useSettingsStore(state => state.settings.stock);

  const width = Math.max(stock.width, 1);
  const depth = Math.max(stock.height, 1);

  const { wcsX, wcsY } = useMemo(() => {
    switch (stock.zeroPosition) {
      case 'center':
        return { wcsX: width / 2, wcsY: depth / 2 };
      case 'top-right':
        return { wcsX: width, wcsY: depth };
      case 'top-left':
        return { wcsX: 0, wcsY: depth };
      case 'bottom-right':
        return { wcsX: width, wcsY: 0 };
      case 'bottom-left':
      default:
        return { wcsX: 0, wcsY: 0 };
    }
  }, [stock.zeroPosition, width, depth]);
  
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
    // Live machine rendering should use machine coordinates so homing lands at machine origin.
    let tx = machine.x.mpos;
    let ty = machine.y.mpos;
    let tz = machine.z.mpos;

    if (isSimulating && simPos) {
      tx = wcsX + simPos.x;
      ty = wcsY + simPos.y;
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

  const stock = useSettingsStore(state => state.settings.stock);
  const bedSizeZ = useSettingsStore(state => state.settings.general.bedSizeZ);

  const width = Math.max(stock.width, 1);
  const depth = Math.max(stock.height, 1);

  const { wcsX, wcsY } = useMemo(() => {
    switch (stock.zeroPosition) {
      case 'center':
        return { wcsX: width / 2, wcsY: depth / 2 };
      case 'top-right':
        return { wcsX: width, wcsY: depth };
      case 'top-left':
        return { wcsX: 0, wcsY: depth };
      case 'bottom-right':
        return { wcsX: width, wcsY: 0 };
      case 'bottom-left':
      default:
        return { wcsX: 0, wcsY: 0 };
    }
  }, [stock.zeroPosition, width, depth]);

  // GCode points are in WCS space; shift by visual WCS zero on the fixed stock.
  const simPoints = useMemo(() => 
    simulatedPath.map(p => new THREE.Vector3(wcsX + p.x, p.z + bedSizeZ, -(wcsY + p.y))), 
  [simulatedPath, bedSizeZ, wcsX, wcsY]);

  const actPoints = useMemo(() => 
    actualPath.map(p => new THREE.Vector3(p.x, p.z + bedSizeZ, -p.y)), 
  [actualPath, bedSizeZ]);

  return (
    <group>
      {simPoints.length > 1 && (
        <Line
          points={simPoints}
          color="#ef4444"
          lineWidth={1.5}
          dashed
          dashSize={5}
          gapSize={3}
          opacity={0.5}
          transparent
        />
      )}
      {actPoints.length > 1 && (
        <Line
          points={actPoints}
          color="#10b981"
          lineWidth={2.5}
        />
      )}
    </group>
  );
}

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
      
      addActualPoint({
        ...curPos,
        isRapid: false
      });

      if (activeToolId) {
          accumulatedTimeRef.current += delta;
          
          if (lastPosRef.current) {
              const dx = curPos.x - lastPosRef.current.x;
              const dy = curPos.y - lastPosRef.current.y;
              const dz = curPos.z - lastPosRef.current.z;
              const dist = Math.sqrt(dx*dx + dy*dy + dz*dz);
              accumulatedDistRef.current += dist;
          }

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
    const unlisten = transport.listen<HeightMapData>('autolevel:grid_update', (event: any) => {
       setMapData(event.payload);
    });
    return () => { unlisten.then(f => f()); };
  }, []);

  const geometry = useMemo(() => {
    if (!mapData) {
      const geo = new THREE.PlaneGeometry(settings.general.bedSizeX, settings.general.bedSizeY, 20, 20);
      geo.rotateX(-Math.PI / 2);
      geo.translate(settings.general.bedSizeX / 2, 0, -settings.general.bedSizeY / 2);
      const positions = geo.attributes.position;
      const colors = new Float32Array(positions.count * 3);
      const defaultColor = new THREE.Color('#333333'); 
      for (let i = 0; i < positions.count; i++) {
         colors[i * 3] = defaultColor.r;
         colors[i * 3 + 1] = defaultColor.g;
         colors[i * 3 + 2] = defaultColor.b;
      }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      return geo;
    }

    const width = (mapData.cols - 1) * mapData.spacing;
    const height = (mapData.rows - 1) * mapData.spacing;
    const geo = new THREE.PlaneGeometry(width, height, mapData.cols - 1, mapData.rows - 1);
    geo.rotateX(-Math.PI / 2);
    const offsetX = mapData.min_x + width / 2;
    const offsetZ = -(mapData.min_y + height / 2);
    geo.translate(offsetX, 0, offsetZ);

    const positions = geo.attributes.position;
    const colors = new Float32Array(positions.count * 3);
    
    let minZ = 0, maxZ = 0;
    if (mapData.grid.length > 0) {
        minZ = Math.min(...mapData.grid);
        maxZ = Math.max(...mapData.grid);
    }
    if (Math.abs(maxZ - minZ) < 0.001) { maxZ = 1.0; minZ = -1.0; }

    const highColor = new THREE.Color('#ef4444');
    const levelColor = new THREE.Color('#eab308');
    const lowColor = new THREE.Color('#3b82f6');
    const tempColor = new THREE.Color();
    
    for (let r = 0; r < mapData.rows; r++) {
      for (let c = 0; c < mapData.cols; c++) {
         const threeR = (mapData.rows - 1) - r; 
         const vIdx = threeR * mapData.cols + c;
         const hmIdx = r * mapData.cols + c;
         const zValue = mapData.grid[hmIdx];
         positions.setY(vIdx, zValue);
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
  }, [mapData, settings.general.bedSizeX, settings.general.bedSizeY]);

  return (
    <mesh geometry={geometry} position={[0, -0.1, 0]}>
      <meshStandardMaterial vertexColors={true} wireframe={true} transparent opacity={0.6} />
    </mesh>
  );
}

function StockMesh() {
  const stock = useSettingsStore(state => state.settings.stock);
  if (!stock.enabled) return null;

  const materialProfiles: Record<string, { color: string; metalness: number; roughness: number; emissive?: string }> = {
    pine:     { color: "#f3d299", metalness: 0.0, roughness: 0.8 },
    mdf:      { color: "#b58d5a", metalness: 0.0, roughness: 0.9 },
    aluminum: { color: "#cbd5e1", metalness: 0.8, roughness: 0.2, emissive: "#1e293b" },
    pvc:      { color: "#f8fafc", metalness: 0.1, roughness: 0.5 },
    pcb:      { color: "#b87333", metalness: 0.9, roughness: 0.2, emissive: "#4a2311" }
  };

  const profile = materialProfiles[stock.material] || materialProfiles.pine;
  const width = Math.max(stock.width, 1);
  const thickness = Math.max(stock.thickness, 1);
  const depth = Math.max(stock.height, 1);

  // Keep workpiece fixed on the bed for visualization.
  // Zero selection should move the WCS reference, not the stock body.
  const finalX = width / 2;
  const finalZ = -depth / 2;
  const finalY = thickness / 2 + 0.05;

  // Position the origin sphere based on zeroPosition
  let originX = 0, originZ = 0;
  switch (stock.zeroPosition) {
    case 'top-left': originX = -width / 2; originZ = -depth / 2; break;
    case 'top-right': originX = width / 2; originZ = -depth / 2; break;
    case 'bottom-left': originX = -width / 2; originZ = depth / 2; break;
    case 'bottom-right': originX = width / 2; originZ = depth / 2; break;
    case 'center': originX = 0; originZ = 0; break;
  }

  return (
    <group position={[finalX, finalY, finalZ]}>
      <mesh receiveShadow castShadow>
        <boxGeometry args={[width, thickness, depth]} />
        <meshStandardMaterial 
          color={profile.color} transparent opacity={stock.opacity}
          roughness={profile.roughness} metalness={profile.metalness}
          emissive={profile.emissive} emissiveIntensity={profile.emissive ? 0.2 : 0}
        />
      </mesh>
      <mesh>
        <boxGeometry args={[width + 0.2, thickness + 0.2, depth + 0.2]} />
        <meshStandardMaterial 
          color={profile.color} wireframe transparent 
          opacity={Math.min(stock.opacity + 0.2, 1.0)} depthWrite={false}
        />
      </mesh>
      
      {/* Zero Point/Origin Indicator */}
      <mesh position={[originX, thickness / 2 + 0.1, originZ]}>
        <sphereGeometry args={[1.5, 12, 12]} />
        <meshBasicMaterial color="#10b981" />
      </mesh>

      {/* Center of Workpiece Indicator (Subtle Crosshair) */}
      <group position={[0, thickness / 2 + 0.08, 0]}>
        <mesh>
          <boxGeometry args={[width * 0.15, 0.01, 1]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} />
        </mesh>
        <mesh>
          <boxGeometry args={[1, 0.01, depth * 0.15]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.6} />
        </mesh>
        <mesh>
          <sphereGeometry args={[1, 8, 8]} />
          <meshBasicMaterial color="#3b82f6" transparent opacity={0.4} />
        </mesh>
      </group>
    </group>
  );
}

function MachineBed() {
  const { settings } = useSettingsStore();
  const bedX = settings.general.bedSizeX;
  const bedY = settings.general.bedSizeY;
  const bedZ = settings.general.bedSizeZ;
  const isMetric = settings.general.carvingUnits === 'mm';

  const formatValue = (val: number) => {
    const displayVal = isMetric ? val : val / 25.4;
    return displayVal.toFixed(isMetric ? 0 : 2);
  };

  const labelSize = 10;
  const labelColor = "#cbd5e1";

  return (
    <group>
      <mesh position={[bedX / 2, -1, -bedY / 2]} receiveShadow>
        <boxGeometry args={[bedX, 2, bedY]} />
        <meshStandardMaterial color="#1e293b" roughness={0.9} metalness={0.1} />
      </mesh>
      <Grid 
        args={[bedX, bedY]} position={[bedX / 2, 0.05, -bedY / 2]}
        cellSize={10} cellThickness={1} cellColor="#334155" 
        sectionSize={50} sectionThickness={1.5} sectionColor="#475569" 
        fadeDistance={500} infiniteGrid={false} followCamera={false}
      />
      
      {/* Grid Labels */}
      <group position={[0, 0.2, 0]}>
        {/* X Axis Labels */}
        {Array.from({ length: Math.floor(bedX / 50) + 1 }).map((_, i) => (
          <Text
            key={`x-${i}`}
            position={[i * 50, labelSize / 2, 5]}
            rotation={[0, 0, 0]}
            fontSize={labelSize}
            color={labelColor}
            anchorX="center"
            anchorY="middle"
          >
            {formatValue(i * 50)}
          </Text>
        ))}
        {/* Y Axis Labels */}
        {Array.from({ length: Math.floor(bedY / 50) + 1 }).map((_, i) => (
          <Text
            key={`y-${i}`}
            position={[-5, labelSize / 2, -i * 50]}
            rotation={[0, -Math.PI / 2, 0]}
            fontSize={labelSize}
            color={labelColor}
            anchorX="center"
            anchorY="middle"
          >
            {formatValue(i * 50)}
          </Text>
        ))}
        {/* Z Axis Labels */}
        {Array.from({ length: Math.floor(bedZ / 20) + 1 }).map((_, i) => (
          <Text
            key={`z-${i}`}
            position={[-5, i * 20, 0]}
            rotation={[0, Math.PI / 4, 0]}
            fontSize={labelSize}
            color={labelColor}
            anchorX="right"
            anchorY="middle"
          >
            {formatValue(i * 20)}
          </Text>
        ))}
      </group>

      <group position={[0, 0, 0]}>
        <Line points={[[0, 0, 0], [bedX, 0, 0]]} color="#ef4444" lineWidth={2} />
        <Line points={[[0, 0, 0], [0, 0, -bedY]]} color="#3b82f6" lineWidth={2} />
        <Line points={[[0, 0, 0], [0, bedZ, 0]]} color="#10b981" lineWidth={2} />
      </group>
    </group>
  );
}

// ─── Touch Plate Visualization ─────────────────────────────────────────────

function CornerTouchPlate() {
  const { settings } = useSettingsStore();
  const stock = settings.stock;
  const probe = settings.probe;

  // Touch plate dimensions (editable from settings)
  const length = Math.max(probe.touchPlateLength, 1);
  const width = Math.max(probe.touchPlateWidth, 1);
  const thickness = Math.max(probe.zOffset || 5, 0.5);

  // Stock dimensions — StockMesh group is centered at (width/2, thickness/2, -depth/2),
  // so its corners in world space are: front-left=(0,0), front-right=(width,0), back-left=(0,-depth), back-right=(width,-depth)
  const stockWidth = Math.max(stock.width, 1);
  const stockDepth = Math.max(stock.height, 1);
  const stockThickness = Math.max(stock.thickness, 1);

  // Distance from each plate edge to hole center
  const holeDiameter = Math.max(probe.holeDiameter || 14.86, 0.5);
  const wallX = Math.max(probe.xWallThickness || 2.63, 0);
  const wallZ = Math.max(probe.yWallThickness || 2.63, 0);
  const holeRadius = Math.max(holeDiameter / 2, 0.5);
  const holeXdist = wallX + holeRadius;
  const holeZdist = wallZ + holeRadius;

  // 3D wrap profile (editable from settings)
  const sideWrapDepth = Math.max(probe.touchPlateWrapDepth ?? 5, 0.5);
  const sideWrapDrop = Math.max(probe.touchPlateWrapHeight ?? 5, 0.5);
  const sideWrapHeight = thickness + sideWrapDrop;
  const wrapOverhangX = Math.max(holeXdist, sideWrapDepth);
  const wrapOverhangZ = Math.max(holeZdist, sideWrapDepth);

  // Stock mesh top surface is at stockThickness + 0.05 in world Y.
  // Place touch plate directly on that surface (no artificial gap).
  const plateY = stockThickness + 0.05 + thickness / 2;

  // For each corner, the outer corner of the plate aligns with the stock corner.
  // Plate center is offset inward by half its dimensions.
  // Hole is in the outer corner quadrant of the plate.
  const corner = probe.touchPlateCorner;
  let plateX: number, plateZ: number;
  let outerEdgeX: number, outerEdgeZ: number;
  let inwardSignX: number, inwardSignZ: number;
  let outwardSignX: number, outwardSignZ: number;

  switch (corner) {
    case 'front-left':
      // Stock corner at world (0, 0). Plate extends +X, -Z (into stock).
      plateX = length / 2;
      plateZ = -width / 2;
      outerEdgeX = -length / 2;
      outerEdgeZ = width / 2;
      inwardSignX = 1;
      inwardSignZ = -1;
      outwardSignX = -1;
      outwardSignZ = 1;
      break;
    case 'front-right':
      // Stock corner at world (stockWidth, 0). Plate extends -X, -Z.
      plateX = stockWidth - length / 2;
      plateZ = -width / 2;
      outerEdgeX = length / 2;
      outerEdgeZ = width / 2;
      inwardSignX = -1;
      inwardSignZ = -1;
      outwardSignX = 1;
      outwardSignZ = 1;
      break;
    case 'back-left':
      // Stock corner at world (0, -stockDepth). Plate extends +X, +Z.
      plateX = length / 2;
      plateZ = -stockDepth + width / 2;
      outerEdgeX = -length / 2;
      outerEdgeZ = -width / 2;
      inwardSignX = 1;
      inwardSignZ = 1;
      outwardSignX = -1;
      outwardSignZ = -1;
      break;
    case 'back-right':
    default:
      // Stock corner at world (stockWidth, -stockDepth). Plate extends -X, +Z.
      plateX = stockWidth - length / 2;
      plateZ = -stockDepth + width / 2;
      outerEdgeX = length / 2;
      outerEdgeZ = -width / 2;
      inwardSignX = -1;
      inwardSignZ = 1;
      outwardSignX = 1;
      outwardSignZ = -1;
      break;
  }

  // Full-edge wrap legs for a true corner plate profile.
  const xFaceWrapCenterX = outerEdgeX + outwardSignX * (wrapOverhangX / 2);
  const xFaceWrapCenterZ = 0;
  const zFaceWrapCenterX = 0;
  const zFaceWrapCenterZ = outerEdgeZ + outwardSignZ * (wrapOverhangZ / 2);
  const cornerWrapCenterX = outerEdgeX + outwardSignX * (wrapOverhangX / 2);
  const cornerWrapCenterZ = outerEdgeZ + outwardSignZ * (wrapOverhangZ / 2);

  // Place hole from the true outermost X/Z edges of the touch plate body.
  const outerMostX = outerEdgeX + outwardSignX * wrapOverhangX;
  const outerMostZ = outerEdgeZ + outwardSignZ * wrapOverhangZ;
  const holeLocalX = outerMostX + inwardSignX * holeXdist;
  const holeLocalZ = outerMostZ + inwardSignZ * holeZdist;

  // Keep side-wrap top faces flush with the top plate top face,
  // then extend downward by `sideWrapDrop` below the stock top.
  const wrapCenterY = thickness / 2 - sideWrapHeight / 2;

  // Aluminum material profile
  const aluminumProfile = {
    color: "#e2e8f0",
    metalness: 0.62,
    roughness: 0.24,
    emissive: "#f8fafc",
    emissiveIntensity: 0.22,
  };

  const aluminumMaterialProps = {
    color: aluminumProfile.color,
    metalness: aluminumProfile.metalness,
    roughness: aluminumProfile.roughness,
    emissive: aluminumProfile.emissive,
    emissiveIntensity: aluminumProfile.emissiveIntensity,
  };

  return (
    <group position={[plateX, plateY, plateZ]}>
      {/* Main touch plate top (square/rect body) */}
      <mesh position={[0, 0, 0]} castShadow receiveShadow>
        <boxGeometry args={[length, thickness, width]} />
        <meshStandardMaterial {...aluminumMaterialProps} />
      </mesh>

      {/* Side leg hugging X face */}
      <mesh position={[xFaceWrapCenterX, wrapCenterY, xFaceWrapCenterZ]} castShadow receiveShadow>
        <boxGeometry args={[wrapOverhangX, sideWrapHeight, width]} />
        <meshStandardMaterial {...aluminumMaterialProps} />
      </mesh>

      {/* Side leg hugging Z face */}
      <mesh position={[zFaceWrapCenterX, wrapCenterY, zFaceWrapCenterZ]} castShadow receiveShadow>
        <boxGeometry args={[length, sideWrapHeight, wrapOverhangZ]} />
        <meshStandardMaterial {...aluminumMaterialProps} />
      </mesh>

      {/* Corner filler so X/Y wraps read as one solid enclosure */}
      <mesh position={[cornerWrapCenterX, wrapCenterY, cornerWrapCenterZ]} castShadow receiveShadow>
        <boxGeometry args={[wrapOverhangX, sideWrapHeight, wrapOverhangZ]} />
        <meshStandardMaterial {...aluminumMaterialProps} />
      </mesh>

      {/* Probe hole cavity (through top plate) */}
      <mesh position={[holeLocalX, 0, holeLocalZ]} castShadow>
        <cylinderGeometry args={[holeRadius, holeRadius, thickness + 0.8, 40]} />
        <meshStandardMaterial
          color="#020617"
          metalness={0.05}
          roughness={0.92}
          emissive="#000000"
          emissiveIntensity={0}
        />
      </mesh>

      {/* Filled top disk for high-contrast, always-visible hole face */}
      <mesh position={[holeLocalX, thickness / 2 + 0.04, holeLocalZ]}>
        <cylinderGeometry args={[holeRadius, holeRadius, 0.08, 64]} />
        <meshBasicMaterial color="#020617" />
      </mesh>

      {/* Subtle metal rim to keep it looking machined, not painted */}
      <mesh position={[holeLocalX, thickness / 2 + 0.05, holeLocalZ]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[holeRadius + 0.18, 0.09, 16, 64]} />
        <meshStandardMaterial color="#64748b" metalness={0.65} roughness={0.35} />
      </mesh>
    </group>
  );
}

function ZTouchPlate() {
  const { settings } = useSettingsStore();
  const stock = settings.stock;
  const probe = settings.probe;

  const thickness = Math.max(probe.zOffset || 5, 0.5);
  const stockWidth = Math.max(stock.width, 1);
  const stockDepth = Math.max(stock.height, 1);
  const stockThickness = Math.max(stock.thickness, 1);
  const shape = probe.zTouchPlateShape ?? 'square';
  const diameter = Math.max(probe.zTouchPlateDiameter ?? 40, 1);
  const length = shape === 'round' ? diameter : Math.max(probe.zTouchPlateLength ?? 40, 1);
  const width = shape === 'round' ? diameter : Math.max(probe.zTouchPlateWidth ?? 40, 1);
  const insetX = THREE.MathUtils.clamp(probe.zTouchPlateInsetX ?? 8, 0, Math.max(stockWidth - length, 0));
  const insetY = THREE.MathUtils.clamp(probe.zTouchPlateInsetY ?? 8, 0, Math.max(stockDepth - width, 0));
  const plateX = insetX + length / 2;
  const plateZ = -(insetY + width / 2);
  const plateY = stockThickness + 0.05 + thickness / 2;
  const radius = diameter / 2;

  const aluminumProfile = {
    color: "#e2e8f0",
    metalness: 0.62,
    roughness: 0.24,
    emissive: "#f8fafc",
    emissiveIntensity: 0.22,
  };

  return (
    <group position={[plateX, plateY, plateZ]}>
      {shape === 'round' ? (
        <>
          <mesh castShadow receiveShadow>
            <cylinderGeometry args={[radius, radius, thickness, 64]} />
            <meshStandardMaterial {...aluminumProfile} />
          </mesh>
          <mesh position={[0, thickness / 2 + 0.04, 0]}>
            <cylinderGeometry args={[Math.max(radius - 2.2, radius * 0.5), Math.max(radius - 2.2, radius * 0.5), 0.08, 64]} />
            <meshBasicMaterial color="#cbd5e1" />
          </mesh>
          <mesh position={[0, thickness / 2 + 0.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[Math.max(radius - 0.75, 0.8), 0.16, 16, 64]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.7} roughness={0.28} />
          </mesh>
        </>
      ) : (
        <>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[length, thickness, width]} />
            <meshStandardMaterial {...aluminumProfile} />
          </mesh>
          <mesh position={[0, thickness / 2 + 0.04, 0]}>
            <boxGeometry args={[Math.max(length - 4, 1), 0.08, Math.max(width - 4, 1)]} />
            <meshBasicMaterial color="#cbd5e1" />
          </mesh>
          <mesh position={[0, thickness / 2 + 0.09, 0]}>
            <boxGeometry args={[Math.max(length - 9, 1), 0.08, Math.max(width - 9, 1)]} />
            <meshBasicMaterial color="#94a3b8" />
          </mesh>
        </>
      )}

      <mesh position={[0, thickness / 2 + 0.12, 0]}>
        <cylinderGeometry args={[1.2, 1.2, 0.08, 32]} />
        <meshBasicMaterial color="#0f172a" />
      </mesh>
    </group>
  );
}

function TouchPlate() {
  const probe = useSettingsStore(state => state.settings.probe);

  if (!probe.showTouchPlateVisual) return null;

  return probe.lastProbeMethod === '3-axis' ? <CornerTouchPlate /> : <ZTouchPlate />;
}

// ─── Scene Content ─────────────────────────────────────────────────────

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
      <TouchPlate />
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
  const clearActualPath = useGcodeStore(state => state.clearActualPath);
  const controlsRef = useRef<any>(null);

  const handleZoom = (direction: 'in' | 'out') => {
    if (controlsRef.current) {
      const scale = direction === 'in' ? 0.8 : 1.2;
      const camera = controlsRef.current.object;
      const target = controlsRef.current.target;
      if (camera.isPerspectiveCamera) {
        const offset = new THREE.Vector3().subVectors(camera.position, target);
        offset.multiplyScalar(scale);
        camera.position.addVectors(target, offset);
      } else {
        camera.zoom /= scale;
        camera.updateProjectionMatrix();
      }
    }
  };

  const toggleTouchPlate = () => {
    const { setProbeSettings } = useSettingsStore.getState();
    setProbeSettings({ showTouchPlateVisual: !settings.probe.showTouchPlateVisual });
  };

  return (
    <div className="w-full h-full bg-[var(--bg-secondary)] overflow-hidden relative rounded-bl-lg rounded-br-lg">
      <Canvas shadows camera={{ position: [300, 300, 300], fov: 45 }} gl={{ antialias: true, alpha: true }} style={{ width: '100%', height: '100%' }}>
        <color attach="background" args={['#0f172a']} />
        <ambientLight intensity={0.4} />
        <hemisphereLight intensity={0.5} groundColor="#000000" />
        <directionalLight position={[100, 150, 100]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
        <pointLight position={[-100, 100, -100]} intensity={0.6} />
        <OrbitControls ref={controlsRef} makeDefault enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2 - 0.05} target={[settings.general.bedSizeX / 2, 0, -settings.general.bedSizeY / 2]} />
        <GizmoHelper alignment="top-right" margin={[60, 60]}>
          <GizmoViewcube 
            opacity={1} color={theme === 'dark' ? "#334155" : "#e2e8f0"}
            strokeColor={theme === 'dark' ? "#cbd5e1" : "#475569"}
            textColor={theme === 'dark' ? "#f8fafc" : "#0f172a"}
            hoverColor="rgba(59, 130, 246, 0.5)" font="bold 24px Inter, sans-serif"
          />
        </GizmoHelper>
        <SceneContent />
      </Canvas>

      <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 z-10">
        <Tooltip content="Zoom In" position="right">
          <button onClick={() => handleZoom('in')} className="p-1.5 bg-[var(--bg-tertiary)]/90 backdrop-blur-sm border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] rounded-lg shadow-sm transition-all">
            <Plus className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip content="Zoom Out" position="right">
          <button onClick={() => handleZoom('out')} className="p-1.5 bg-[var(--bg-tertiary)]/90 backdrop-blur-sm border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)] rounded-lg shadow-sm transition-all">
            <Minus className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <div className="border-t border-[var(--border-color)]/20 my-1" />
        <Tooltip content="Toggle Touch Plate" position="right">
          <button 
            onClick={toggleTouchPlate}
            className={`p-1.5 rounded-lg shadow-sm transition-all border ${
              settings.probe.showTouchPlateVisual
                ? 'bg-[var(--accent-primary)]/20 border-[var(--accent-primary)] text-[var(--accent-primary)]'
                : 'bg-[var(--bg-tertiary)]/90 backdrop-blur-sm border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--accent-primary)] hover:border-[var(--accent-primary)]'
            }`}
          >
            <Hexagon className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
      </div>
      
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none bg-[var(--bg-tertiary)]/80 backdrop-blur-md border border-[var(--border-color)] px-4 py-2 rounded-xl shadow-lg flex items-center gap-6 z-10 transition-all max-w-[calc(100%-140px)] overflow-hidden">
        <div className="flex flex-col border-r border-[var(--border-color)]/30 pr-4 shrink-0">
          <h3 className="text-[9px] font-bold text-[var(--accent-primary)] uppercase tracking-widest leading-tight">Live View</h3>
          <span className="text-[9px] font-mono text-[var(--text-tertiary)] whitespace-nowrap">{settings.general.bedSizeX}×{settings.general.bedSizeY}mm</span>
        </div>
        <div className="flex items-center gap-5 overflow-hidden">
          <div className="flex items-center gap-2"><span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase">X</span><span className="text-xs font-mono font-bold text-[var(--text-primary)] min-w-[50px]">{machine.x.mpos.toFixed(2)}</span></div>
          <div className="flex items-center gap-2"><span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase">Y</span><span className="text-xs font-mono font-bold text-[var(--text-primary)] min-w-[50px]">{machine.y.mpos.toFixed(2)}</span></div>
          <div className="flex items-center gap-2"><span className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase">Z</span><span className="text-xs font-mono font-bold text-[var(--accent-primary)] min-w-[50px]">{machine.z.mpos.toFixed(2)}</span></div>
        </div>
        <div className="hidden sm:flex items-center gap-3 border-l border-[var(--border-color)]/30 pl-4 shrink-0">
           <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-500/80" /><span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase font-mono">X</span></div>
           <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-500/80" /><span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase font-mono">Y</span></div>
           <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-green-500/80" /><span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase font-mono">Z</span></div>
        </div>
      </div>

      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
        <Tooltip content="Clear Recorded Path" position="left">
          <button 
            onClick={clearActualPath} 
            className="p-2 bg-[var(--bg-tertiary)]/90 backdrop-blur-md border border-emerald-500/30 text-emerald-500 hover:text-white hover:bg-emerald-500 rounded-xl shadow-lg transition-all group"
          >
            <Eraser className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        </Tooltip>
        <Tooltip content="Clear Simulated Path" position="left">
          <button 
            onClick={clearSimulation} 
            className="p-2 bg-[var(--bg-tertiary)]/90 backdrop-blur-md border border-red-500/30 text-red-400 hover:text-white hover:bg-red-500 rounded-xl shadow-lg transition-all group"
          >
            <FileX className="w-4 h-4 group-hover:scale-110 transition-transform" />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
