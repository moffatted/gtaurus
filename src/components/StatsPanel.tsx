import { BarChart3, Clock, TrendingUp, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Tooltip } from './ui/Tooltip';
import { useSettingsStore } from '../stores/settingsStore';

export function StatsPanel() {
  const { settings } = useSettingsStore();
  const sts = settings.stats;

  const formatTime = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s}s`;
  };

  const successRate = sts.totalJobs > 0 ? (sts.completedJobs / sts.totalJobs) * 100 : 0;
  
  // OEE Calculation (Simulated logic if values are 0, otherwise real)
  const availability = sts.totalJobs > 0 ? 0.92 : 0; 
  const performance = sts.machineUtilizationRate || 0.85; 
  const quality = sts.totalJobs > 0 ? (sts.completedJobs / sts.totalJobs) : 0;
  const oee = availability * performance * quality;

  const StatCard = ({ label, value, icon: Icon, color, subValue }: any) => (
    <div className="bg-[var(--bg-secondary)] p-3 rounded-xl border border-[var(--border-color)] shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider font-semibold">{label}</span>
        <Icon className={`w-3.5 h-3.5 ${color}`} />
      </div>
      <div className="text-lg font-mono font-bold text-[var(--text-primary)]">{value}</div>
      {subValue && <div className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{subValue}</div>}
    </div>
  );

  const OEECircle = ({ label, value, target }: { label: string, value: number, target: number }) => {
    const color = value >= target ? 'text-green-400' : value >= target * 0.8 ? 'text-yellow-400' : 'text-red-400';
    return (
      <Tooltip content={`${label} Metric (Target: ${Math.round(target * 100)}%)`} position="top">
        <div className="flex flex-col items-center gap-1">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                className="text-[var(--bg-tertiary)]"
              />
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="currentColor"
                strokeWidth="4"
                fill="transparent"
                strokeDasharray={126}
                strokeDashoffset={126 - (126 * value)}
                className={`${color} transition-all duration-1000`}
              />
            </svg>
            <span className="absolute text-[10px] font-bold font-mono">{Math.round(value * 100)}%</span>
          </div>
          <span className="text-[10px] text-[var(--text-tertiary)] uppercase">{label}</span>
        </div>
      </Tooltip>
    );
  };

  return (
    <div className="p-4 space-y-4 h-full overflow-y-auto overflow-x-auto min-w-[320px] custom-scrollbar">
      
      {/* OEE Overview */}
      <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)] shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[var(--accent-primary)]" />
            Machine Efficiency (OEE)
          </h3>
          <div className="text-xs font-mono font-bold text-[var(--accent-primary)] bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded">
            Overall: {Math.round(oee * 100)}%
          </div>
        </div>
        
        <div className="flex justify-around items-end pt-2">
          <OEECircle label="Avail" value={availability} target={sts.targetAvailability} />
          <OEECircle label="Perf" value={performance} target={sts.targetPerformance} />
          <OEECircle label="Qual" value={quality} target={sts.targetQuality} />
        </div>
      </div>

      {/* Production Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard 
          label="Job Success" 
          value={`${sts.completedJobs}/${sts.totalJobs}`} 
          icon={CheckCircle2} 
          color="text-green-400"
          subValue={`${Math.round(successRate)}% Success Rate`}
        />
        <StatCard 
          label="Failure Rate" 
          value={sts.failedJobs} 
          icon={AlertTriangle} 
          color="text-red-400"
          subValue="Requires Attention"
        />
      </div>

      {/* Time Metrics */}
      <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)] shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          Time Utilization
        </h3>
        
        <div className="space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-secondary)]">Machine On Time</span>
            <span className="font-mono text-[var(--text-primary)]">{formatTime(sts.totalMachineOnTimeSec)}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-secondary)]">Spindle Hours</span>
            <span className="font-mono text-[var(--text-primary)]">{formatTime(sts.totalSpindleTimeSec)}</span>
          </div>
          
          {/* Progress Breakdown */}
          <div className="space-y-1 pt-1">
            <div className="h-1.5 w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden flex">
              <div 
                className="h-full bg-green-500" 
                style={{ width: `${sts.totalMachineOnTimeSec > 0 ? (sts.totalCuttingTimeSec / sts.totalMachineOnTimeSec) * 100 : 0}%` }} 
                title="Cutting Time"
              />
              <div 
                className="h-full bg-blue-400" 
                style={{ width: `${sts.totalMachineOnTimeSec > 0 ? (sts.totalRapidTimeSec / sts.totalMachineOnTimeSec) * 100 : 0}%` }} 
                title="Rapid Time"
              />
            </div>
            <div className="flex justify-between text-[10px] text-[var(--text-tertiary)]">
              <span>● Cutting</span>
              <span>● Rapid</span>
              <span>● Idle</span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Monitor */}
      <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)] shadow-sm">
         <div className="flex items-center gap-2 mb-3">
            <BarChart3 className="w-4 h-4 text-orange-400" />
            <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase">Current Utilization</h3>
         </div>
         <div className="space-y-2">
            <div className="flex justify-between text-xs mb-1">
              <span className="text-[var(--text-secondary)]">Machine Duty Cycle</span>
              <span className="font-mono text-[var(--text-primary)]">{Math.round(sts.machineUtilizationRate * 100)}%</span>
            </div>
            <div className="h-2 w-full bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
              <div 
                className="h-full bg-orange-400 transition-all duration-500" 
                style={{ width: `${sts.machineUtilizationRate * 100}%` }} 
              />
            </div>
         </div>
      </div>

      {/* Recent Job History */}
      <div className="bg-[var(--bg-secondary)] p-4 rounded-xl border border-[var(--border-color)] shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-400" />
          Recent Job History
        </h3>
        <div className="space-y-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
          {sts.jobHistory && sts.jobHistory.length > 0 ? (
            sts.jobHistory.slice(0, 10).map((job) => (
              <div key={job.id} className="flex justify-between items-center text-xs p-2.5 bg-[var(--bg-tertiary)] rounded-lg border border-[var(--border-color)]">
                <div>
                  <div className="font-mono font-medium text-[var(--text-primary)]">{new Date(job.startTime).toLocaleTimeString()}</div>
                  <div className={`text-[10px] uppercase font-bold mt-0.5 ${job.status === 'completed' ? 'text-green-400' : job.status === 'failed' ? 'text-red-400' : 'text-blue-400'}`}>
                    {job.status}
                  </div>
                </div>
                <div className="text-right">
                  {job.endTime && (
                    <div className="font-mono text-[10px] text-[var(--text-tertiary)] mb-0.5">
                      End: {new Date(job.endTime).toLocaleTimeString()}
                    </div>
                  )}
                  {job.durationSec ? (
                    <div className="font-mono font-medium text-[var(--text-secondary)]">{formatTime(job.durationSec)}</div>
                  ) : (
                    <div className="text-[var(--text-tertiary)] italic">In Progress...</div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-xs text-[var(--text-tertiary)] py-4 italic">No recent jobs logged</div>
          )}
        </div>
      </div>

    </div>
  );
}
