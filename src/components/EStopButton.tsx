import { OctagonAlert } from 'lucide-react';
import { useState } from 'react';
import { Tooltip } from './ui/Tooltip';
import { transport } from '../services/transportService';

export function EStopButton() {
  const [active, setActive] = useState(false);

  const handleStop = async () => {
    setActive(true);
    try {
      // Send 0x18 (Ctrl+X / Soft Reset)
      await transport.invoke('send_realtime', { byte: 0x18 });
    } finally {
      setTimeout(() => setActive(false), 200);
    }
  };

  return (
    <Tooltip content="Software E-Stop (Ctrl+X) - Halts machine immediately" position="bottom" className="flex items-center">
      <button
        onClick={handleStop}
        className={`
          flex items-center gap-2 px-4 py-2 rounded-lg font-bold text-white shadow-md transition-all duration-150 btn-3d
          ${active 
            ? 'bg-red-700 scale-95 shadow-inner' 
            : 'bg-red-600 hover:bg-red-500 hover:shadow-lg active:scale-95'
          }
        `}
        aria-label="Emergency Stop"
      >
        <OctagonAlert className="w-5 h-5 fill-white/20 text-white" strokeWidth={2.5} />
        <span className="tracking-wider">STOP</span>
      </button>
    </Tooltip>
  );
}
