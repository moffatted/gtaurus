/**
 * @file checkpoint.ts
 * @purpose Type definitions for job resume checkpoints and recovery state.
 */

/**
 * A snapshot of machine state at the moment a job was interrupted or paused.
 * This data is persisted to disk and used to reconstruct the machine state during recovery.
 */
export interface JobCheckpoint {
  /** Unique identifier for this checkpoint */
  checkpointId: string;
  
  /** Original G-code file metadata */
  fileHash: string;
  filePath: string;
  fileName: string;
  
  /** Job position tracking */
  currentLine: number;
  totalLines: number;
  lineContent: string;
  
  /** Machine state at interruption */
  machineState: {
    status: string;
    mpos: { x: number; y: number; z: number };
    wpos: { x: number; y: number; z: number };
  };
  
  /** G-code modal state */
  modalState: {
    units: 'G20' | 'G21'; // Inches or Millimeters
    distanceMode: 'G90' | 'G91'; // Absolute or Relative
    plane: 'G17' | 'G18' | 'G19'; // XY, ZX, or YZ plane
    motionMode: 'G0' | 'G1' | 'G2' | 'G3'; // Motion type
    feedMode: 'G93' | 'G94' | 'G95'; // Inverse time, units/min, units/rev
  };
  
  /** Work/Tool state */
  workOffsetSystem: 'G54' | 'G55' | 'G56' | 'G57' | 'G58' | 'G59';
  toolNumber: number | null;
  toolLengthOffset: number;
  
  /** Spindle state */
  spindle: {
    isActive: boolean;
    rpm: number;
    direction: 'CW' | 'CCW' | null;
  };
  
  /** Feed rate (F value) */
  feedRate: number;
  
  /** Reason for interruption */
  interruptionReason: 'user_pause' | 'power_loss' | 'alarm' | 'manual_stop' | 'unknown';
  
  /** Timestamp of checkpoint */
  timestamp: number;
}

export interface ResumeState {
  /** Currently loaded checkpoint (if any) */
  checkpoint: JobCheckpoint | null;
  
  /** Whether a resume wizard is open */
  isResumeWizardOpen: boolean;
  
  /** Current step in the resume wizard */
  resumeStep: 
    | 'idle'
    | 'checkpoint_summary'
    | 'machine_status_check'
    | 'file_validation'
    | 'home_decision'
    | 'probe_decision'
    | 'tool_modal_restore'
    | 'safe_z_approach'
    | 'preview_path'
    | 'visual_confirmation'
    | 'resume_execution'
    | 'completed'
    | 'error';
  
  /** Validation status for each step */
  validations: {
    machineRecoverable: boolean;
    fileHashMatches: boolean;
    homeConfirmed: boolean;
    probeConfirmed: boolean;
    toolConfirmed: boolean;
    pathPreviewConfirmed: boolean;
  };
  
  /** Errors or messages to display */
  message: string | null;
  isLoading: boolean;
}
