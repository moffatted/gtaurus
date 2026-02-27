import { Crosshair } from 'lucide-react';
import { BasicAutolevelUI } from './shared/BasicAutolevelUI';

export function AutoLevelPanel() {
  return (
    <div className="flex flex-col h-full bg-[#1A1A1A] overflow-x-auto min-w-[360px]">
      <div className="flex items-center gap-2 p-3 border-b border-[#333]">
        <Crosshair size={18} className="text-[#00E5FF]" />
        <h2 className="font-semibold text-white tracking-wide uppercase">Surface Calibration</h2>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        <BasicAutolevelUI />
      </div>
    </div>
  );
}
