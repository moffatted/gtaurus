import { useMachineStatusStore } from '../stores/machineStatusStore';
import { TriangleAlert } from 'lucide-react';
import { Tooltip } from './ui/Tooltip';

export function AlarmIndicator({ className }: { className?: string }) {
  const { machine } = useMachineStatusStore();
  const isAlarm = machine.status.toLowerCase().includes('alarm');

  if (!isAlarm) return null;

  return (
    <Tooltip content="Machine is in Alarmed State! Press Reset ($X) to clear if safe." position="bottom">
      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest animate-pulse shadow-lg ${className}`}>
        <TriangleAlert className="w-3.5 h-3.5 fill-white" />
        ALARM
      </div>
    </Tooltip>
  );
}
