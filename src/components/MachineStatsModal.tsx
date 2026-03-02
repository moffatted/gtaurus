/**
 * @file MachineStatsModal.tsx
 * @purpose A non-modal, draggable, and resizable window wrapper for the StatsPanel.
 */
import { BarChart2 } from "lucide-react";
import { useUIStore } from "../stores/uiStore";
import { StatsPanel } from "./StatsPanel";
import { FloatingWindow } from "./ui/FloatingWindow";

export function MachineStatsModal() {
  const { machineStatsOpen, closeMachineStats } = useUIStore();

  return (
    <FloatingWindow
      title="Machine Statistics"
      icon={<BarChart2 className="w-5 h-5 text-orange-400" />}
      isOpen={machineStatsOpen}
      onClose={closeMachineStats}
      defaultPosition={{ x: 200, y: 200 }}
      defaultSize={{ width: 450, height: 600 }}
      minWidth={350}
      minHeight={400}
      zIndex={120}
    >
      <StatsPanel />
    </FloatingWindow>
  );
}
