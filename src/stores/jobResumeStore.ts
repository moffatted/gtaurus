/**
 * @file jobResumeStore.ts
 * @purpose Manages job checkpoint persistence and resume wizard state.
 */
import { create } from 'zustand';
import { JobCheckpoint, ResumeState } from '../types/checkpoint';

interface JobResumeStore extends ResumeState {
  // Checkpoint management
  setCheckpoint: (checkpoint: JobCheckpoint | null) => void;
  createCheckpoint: (data: Partial<JobCheckpoint>) => JobCheckpoint;
  clearCheckpoint: () => void;
  
  // Resume wizard state
  openResumeWizard: () => void;
  closeResumeWizard: () => void;
  setResumeStep: (step: ResumeState['resumeStep']) => void;
  
  // Validation updates
  setMachineRecoverable: (value: boolean) => void;
  setFileHashMatches: (value: boolean) => void;
  setHomeConfirmed: (value: boolean) => void;
  setProbeConfirmed: (value: boolean) => void;
  setToolConfirmed: (value: boolean) => void;
  setPathPreviewConfirmed: (value: boolean) => void;
  
  // Message and loading state
  setMessage: (message: string | null) => void;
  setIsLoading: (loading: boolean) => void;
  
  // Reset wizard
  resetResumeWizard: () => void;
}

const defaultResumeState: ResumeState = {
  checkpoint: null,
  isResumeWizardOpen: false,
  resumeStep: 'idle',
  validations: {
    machineRecoverable: false,
    fileHashMatches: false,
    homeConfirmed: false,
    probeConfirmed: false,
    toolConfirmed: false,
    pathPreviewConfirmed: false,
  },
  message: null,
  isLoading: false,
};

export const useJobResumeStore = create<JobResumeStore>((set) => ({
  ...defaultResumeState,

  setCheckpoint: (checkpoint) => set({ checkpoint }),
  
  createCheckpoint: (data): JobCheckpoint => {
    const checkpoint: JobCheckpoint = {
      checkpointId: `checkpoint-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fileHash: data.fileHash || '',
      filePath: data.filePath || '',
      fileName: data.fileName || '',
      currentLine: data.currentLine || 0,
      totalLines: data.totalLines || 0,
      lineContent: data.lineContent || '',
      machineState: data.machineState || { status: '', mpos: { x: 0, y: 0, z: 0 }, wpos: { x: 0, y: 0, z: 0 } },
      modalState: data.modalState || {
        units: 'G21',
        distanceMode: 'G90',
        plane: 'G17',
        motionMode: 'G0',
        feedMode: 'G94',
      },
      workOffsetSystem: data.workOffsetSystem || 'G54',
      toolNumber: data.toolNumber || null,
      toolLengthOffset: data.toolLengthOffset || 0,
      spindle: data.spindle || { isActive: false, rpm: 0, direction: null },
      feedRate: data.feedRate || 0,
      interruptionReason: data.interruptionReason || 'unknown',
      timestamp: data.timestamp || Date.now(),
    };
    set({ checkpoint });
    return checkpoint;
  },

  clearCheckpoint: () => set({ checkpoint: null }),

  openResumeWizard: () => set({ isResumeWizardOpen: true, resumeStep: 'checkpoint_summary' }),

  closeResumeWizard: () => set({ isResumeWizardOpen: false, resumeStep: 'idle' }),

  setResumeStep: (step) => set({ resumeStep: step }),

  setMachineRecoverable: (value) =>
    set((state) => ({
      validations: { ...state.validations, machineRecoverable: value },
    })),

  setFileHashMatches: (value) =>
    set((state) => ({
      validations: { ...state.validations, fileHashMatches: value },
    })),

  setHomeConfirmed: (value) =>
    set((state) => ({
      validations: { ...state.validations, homeConfirmed: value },
    })),

  setProbeConfirmed: (value) =>
    set((state) => ({
      validations: { ...state.validations, probeConfirmed: value },
    })),

  setToolConfirmed: (value) =>
    set((state) => ({
      validations: { ...state.validations, toolConfirmed: value },
    })),

  setPathPreviewConfirmed: (value) =>
    set((state) => ({
      validations: { ...state.validations, pathPreviewConfirmed: value },
    })),

  setMessage: (message) => set({ message }),

  setIsLoading: (loading) => set({ isLoading: loading }),

  resetResumeWizard: () => set({
    ...defaultResumeState,
    checkpoint: useJobResumeStore.getState().checkpoint || null,
  }),
}));
