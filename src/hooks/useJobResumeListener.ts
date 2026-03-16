/**
 * @file useJobResumeListener.ts
 * @purpose Hook for listening to job status events and triggering resume wizard when appropriate.
 */
import { useEffect, useCallback } from 'react';
import { useJobResumeStore } from '../stores/jobResumeStore';
import { useGcodeStore } from '../stores/gcodeStore';
import { useMachineStatusStore } from '../stores/machineStatusStore';
import { useToolStore } from '../stores/toolStore';
import { transport } from '../services/transportService';

export function useJobResumeListener() {
  const {
    createCheckpoint,
    openResumeWizard,
  } = useJobResumeStore();

  const { machine } = useMachineStatusStore();
  const { activeFilePath, activeFileName } = useGcodeStore();
  const { tools, activeToolId } = useToolStore();

  // Get file hash from server
  const getFileHash = useCallback(async (filePath: string): Promise<string> => {
    try {
      const result = await transport.invoke<string>('compute_file_hash', {
        path: filePath,
      });
      return result;
    } catch (e) {
      console.error('Failed to compute file hash:', e);
      return 'unknown';
    }
  }, []);

  // Save checkpoint to server
  const saveCheckpointToServer = useCallback(
    async (checkpoint: any) => {
      try {
        // Determine the save path (adjacent to the G-code file)
        const checkpointPath = await transport.invoke<string>(
          'get_resume_checkpoint_path',
          { path: activeFilePath }
        );

        const result = await transport.invoke(
          'save_checkpoint',
          {
            checkpoint,
            savePath: checkpointPath,
          }
        );
        console.log('[Resume] Checkpoint saved:', result);
      } catch (e) {
        console.error('[Resume] Failed to save checkpoint to server:', e);
      }
    },
    [activeFilePath]
  );

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

          // When job is paused, create and save a checkpoint
          if (payload.status === 'paused') {
            const fileHash = await getFileHash(activeFilePath || '');
            const activeTool = tools.find(t => t.id === activeToolId);

            const checkpoint = createCheckpoint({
              fileHash,
              filePath: activeFilePath || '',
              fileName: activeFileName || '',
              currentLine: payload.currentLine || 0,
              totalLines: payload.totalLines || 0,
              machineState: {
                status: machine.status,
                mpos: { x: machine.x.mpos, y: machine.y.mpos, z: machine.z.mpos },
                wpos: { x: machine.x.mpos, y: machine.y.mpos, z: machine.z.mpos },
              },
              modalState: {
                units: 'G21',
                distanceMode: 'G90',
                plane: 'G17',
                motionMode: 'G0',
                feedMode: 'G94',
              },
              toolNumber: activeTool?.number,
              feedRate: machine.feed,
              spindle: {
                isActive: machine.isSpindleActive || false,
                rpm: machine.spindle,
                direction: machine.isSpindleActive ? 'CW' : null,
              },
              interruptionReason: 'user_pause',
              timestamp: Date.now(),
            });

            // Save checkpoint to server
            await saveCheckpointToServer(checkpoint);

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
  }, [activeFilePath, activeFileName, machine, tools, activeToolId, createCheckpoint, openResumeWizard, getFileHash, saveCheckpointToServer]);
}
