import { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';
import { useSettingsStore, JobHistoryEntry } from '../stores/settingsStore';

export function useStatsTracker() {
  const { settings, setStatsSettings } = useSettingsStore();
  const lastUpdateRef = useRef<number>(Date.now());
  const jobActiveRef = useRef<boolean>(false);
  const jobStartRef = useRef<number>(0);

  useEffect(() => {
    if (!settings.stats.enableLogging) return;

    const unlisten = listen<string>('fluidnc://rx', (event) => {
      const line = event.payload;
      if (!line.startsWith('<') || !line.endsWith('>')) return;

      const content = line.slice(1, -1);
      const parts = content.split('|');
      const status = parts[0];
      
      let spindleSpeed = 0;
      parts.slice(1).forEach((part) => {
        const [key, val] = part.split(':');
        if (key === 'FS') {
          const [_, s] = val.split(',').map(Number);
          spindleSpeed = s || 0;
        }
      });

      const now = Date.now();
      const deltaSec = (now - lastUpdateRef.current) / 1000;
      lastUpdateRef.current = now;

      // Update machine on time (machine is connected and status is received)
      setStatsSettings({
        totalMachineOnTimeSec: settings.stats.totalMachineOnTimeSec + deltaSec
      });

      if (status.startsWith('Run')) {
        // Job tracking
        if (!jobActiveRef.current) {
          jobActiveRef.current = true;
          jobStartRef.current = now;
          const newJob: JobHistoryEntry = {
            id: `job-${now}`,
            startTime: now,
            status: 'running'
          };
          setStatsSettings({ 
             totalJobs: settings.stats.totalJobs + 1,
             jobHistory: [newJob, ...settings.stats.jobHistory].slice(0, 50)
          });
        }

        // Utilization metrics
        const isCutting = spindleSpeed > 100; // Rough heuristic: spindle is running fast
        
        setStatsSettings({
          totalSpindleTimeSec: settings.stats.totalSpindleTimeSec + (spindleSpeed > 0 ? deltaSec : 0),
          totalCuttingTimeSec: settings.stats.totalCuttingTimeSec + (isCutting ? deltaSec : 0),
          totalRapidTimeSec: settings.stats.totalRapidTimeSec + (isCutting ? 0 : deltaSec),
          // Simple simulated utilization rate (active time / total time since app start)
          machineUtilizationRate: Math.min(0.95, (settings.stats.totalCuttingTimeSec + deltaSec) / (settings.stats.totalMachineOnTimeSec + deltaSec + 0.1))
        });
      } else if (jobActiveRef.current && (status.startsWith('Idle') || status.startsWith('Alarm'))) {
        // Job finished or aborted
        jobActiveRef.current = false;
        const durationSec = (now - jobStartRef.current) / 1000;
        const isCompleted = status.startsWith('Idle');
        
        if (durationSec >= settings.stats.minJobDurationSec) {
          const updatedHistory = [...settings.stats.jobHistory];
          if (updatedHistory.length > 0) {
            updatedHistory[0] = {
              ...updatedHistory[0],
              endTime: now,
              durationSec,
              status: isCompleted ? 'completed' : 'failed'
            };
          }

          if (isCompleted) {
            setStatsSettings({ 
                completedJobs: settings.stats.completedJobs + 1,
                jobHistory: updatedHistory
            });
          } else {
            setStatsSettings({ 
                failedJobs: settings.stats.failedJobs + 1,
                jobHistory: updatedHistory
            });
          }
        } else {
          // Revert job count if too short
          const updatedHistory = settings.stats.jobHistory.slice(1);
          setStatsSettings({ 
              totalJobs: Math.max(0, settings.stats.totalJobs - 1),
              jobHistory: updatedHistory
          });
        }
      }
    });

    return () => {
      unlisten.then(f => f());
    };
  }, [settings.stats, setStatsSettings]);
}
