/**
 * @file useJobResumeListener.ts
 * @purpose Hook for listening to job status events and triggering resume wizard when appropriate.
 */
import { useEffect, useCallback } from 'react';
import { useJobResumeStore } from '../stores/jobResumeStore';
import { useGcodeStore } from '../stores/gcodeStore';
import { useMachineStatusStore } from '../stores/machineStatusStore';
import { transport } from '../services/transportService';
import * as crypto from 'crypto';

export function useJobResumeListener() {
  const {
    createCheckpoint,
    openResumeWizard,
  } = useJobResumeStore();

  const { machine } = useMachineStatusStore();
  const { activeFilePath, activeFileName, gcode } = useGcodeStore();

  // Compute file hash
  const computeFileHash = useCallback(async (filePath: string): Promise<string> => {
    try {
      // For now, use a simple hash based on file path and content
      // In production, read file and compute SHA256
      const hash = (filePath + (gcode || '')).split('').reduce((a, b) => {
        a = ((a << 5) - a) + b.charCodeAt(0);
        return a & a;
      }, 0);
      return hash.toString(16);
    } catch {
      return 'unknown';
    }
  }, [gcode]);

  // Listen for job status updates
  useEffect(() => {
    let unlistenFn: (() => void) | null = null;

    const setupListener = async () => {
      if (!transport.isWebSocketMode()) {
        // For Tauri mode, Tauri event system would be used instead
        return;
      }

      // Listen for job status events from the server
      try {
        unlistenFn = await transport.listen('job://status', async (event: any) => {
          const payload = event.payload;

          // When job is paused, create a checkpoint
          if (payload.status === 'paused') {
            const fileHash = await computeFileHash(activeFilePath || '');
            const checkpoint = createCheckpoint({
              fileHash,
              filePath: activeFilePath || '',
              fileName: activeFileName || '',
              currentLine: payload.currentLine || 0,
              totalLines: payload.totalLines || 0,
              machineState: {
                status: machine.status,
                mpos: { x: machine.x.mpos, y: machine.y.mpos, z: machine.z.mpos },
                wpos: { x: machine.x.wco, y: machine.y.wco, z: machine.z.wco },
              },
              modalState: {
                units: 'G21',
                distanceMode: 'G90',
                plane: 'G17',
                motionMode: 'G0',
                feedMode: 'G94',
              },
              feedRate: machine.feed,
              spindle: {
                isActive: machine.isSpindleActive || false,
                rpm: machine.spindle,
                direction: machine.isSpindleActive ? 'CW' : null,
              },
              interruptionReason: 'user_pause',
              timestamp: Date.now(),
            });

            // Persist checkpoint to disk
            try {
              await transport.invoke('save_checkpoint', {
                checkpoint,
                savePath: activeFilePath?.replace(/\.[^.]+$/, '.resume.json'),
              });
            } catch (e) {
              console.error('Failed to save checkpoint:', e);
            }

            // Open the resume wizard
            openResumeWizard();
          }
        });
      } catch (e) {
        console.error('Failed to setup job status listener:', e);
      }
    };

    setupListener();

    return () => {
      if (unlistenFn) {
        unlistenFn();
      }
    };
  }, [activeFilePath, activeFileName, machine, createCheckpoint, openResumeWizard, computeFileHash]);
}
