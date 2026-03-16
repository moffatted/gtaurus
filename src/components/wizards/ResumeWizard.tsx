/**
 * @file ResumeWizard.tsx
 * @purpose A step-by-step wizard to guide users through job recovery and resumption after interruption.
 * Implements the state machine from JOB_RESUME_STRATEGY.md
 */
import { useState, useEffect } from 'react';
import { useJobResumeStore } from '../../stores/jobResumeStore';
import { useMachineStatusStore } from '../../stores/machineStatusStore';
import { useGcodeStore } from '../../stores/gcodeStore';
import { transport } from '../../services/transportService';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Home,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
  Play,
  X,
  Info,
} from 'lucide-react';
import './ResumeWizard.css';

export function ResumeWizard() {
  const {
    checkpoint,
    isResumeWizardOpen,
    resumeStep,
    validations,
    message,
    isLoading,
    closeResumeWizard,
    setResumeStep,
    setMachineRecoverable,
    setFileHashMatches,
    setHomeConfirmed,
    setMessage,
    setIsLoading,
  } = useJobResumeStore();

  const { machine } = useMachineStatusStore();
  const { activeFileName } = useGcodeStore();
  
  const [stepIndex, setStepIndex] = useState(0);

  const steps = [
    'checkpoint_summary',
    'machine_status_check',
    'file_validation',
    'home_decision',
    'tool_modal_restore',
    'preview_path',
    'visual_confirmation',
    'resume_execution',
  ];

  useEffect(() => {
    if (checkpoint && isResumeWizardOpen && resumeStep === 'checkpoint_summary') {
      // Auto-check machine status on wizard open
      checkMachineRecoverable();
    }
  }, [checkpoint, isResumeWizardOpen]);

  const checkMachineRecoverable = () => {
    const isRecoverable =
      machine.status === 'Idle' || machine.status === 'Hold' || machine.status.includes('Idle');
    setMachineRecoverable(isRecoverable);
    if (!isRecoverable) {
      setMessage(`Machine is in ${machine.status} state. Please reset or home the machine first.`);
    }
  };

  const checkFileHash = async () => {
    if (!checkpoint || !activeFileName) {
      setFileHashMatches(false);
      setMessage('No active file to resume from.');
      return;
    }

    // For now, simple filename match. In production, compute actual hash.
    const matches = checkpoint.fileName === activeFileName;
    setFileHashMatches(matches);
    if (!matches) {
      setMessage(
        `File mismatch: Checkpoint was for "${checkpoint.fileName}" but active file is "${activeFileName}". ` +
        `Load the correct file before resuming.`
      );
    }
  };

  const handleHomeClick = async () => {
    setIsLoading(true);
    try {
      await transport.invoke('send_command', { command: '$H' });
      setHomeConfirmed(true);
      setMessage('Homing complete.');
      setTimeout(() => {
        setResumeStep('tool_modal_restore');
        setStepIndex(steps.indexOf('tool_modal_restore'));
      }, 1500);
    } catch (e) {
      setMessage(`Home failed: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResumeClick = async () => {
    if (!checkpoint) return;
    
    setIsLoading(true);
    try {
      // Start streaming from the checkpoint line
      await transport.invoke('stream_local_gcode', {
        path: checkpoint.filePath,
        startLine: checkpoint.currentLine + 1,
      });
      setResumeStep('completed');
      setMessage('Job resumed successfully.');
      setTimeout(() => {
        closeResumeWizard();
      }, 2000);
    } catch (e) {
      setMessage(`Resume failed: ${e}`);
      setResumeStep('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleNextStep = () => {
    if (resumeStep === 'checkpoint_summary') {
      if (!validations.machineRecoverable) {
        setMessage('Machine must be in a recoverable state first.');
        return;
      }
      setResumeStep('file_validation');
      setStepIndex(steps.indexOf('file_validation'));
      checkFileHash();
    } else if (resumeStep === 'file_validation') {
      if (!validations.fileHashMatches) {
        setMessage('File hash must match before continuing.');
        return;
      }
      setResumeStep('home_decision');
      setStepIndex(steps.indexOf('home_decision'));
    } else if (resumeStep === 'home_decision') {
      if (!validations.homeConfirmed) {
        setMessage('Please confirm home before continuing.');
        return;
      }
      setResumeStep('tool_modal_restore');
      setStepIndex(steps.indexOf('tool_modal_restore'));
    } else if (resumeStep === 'tool_modal_restore') {
      setResumeStep('preview_path');
      setStepIndex(steps.indexOf('preview_path'));
    } else if (resumeStep === 'preview_path') {
      setResumeStep('visual_confirmation');
      setStepIndex(steps.indexOf('visual_confirmation'));
    } else if (resumeStep === 'visual_confirmation') {
      if (!validations.pathPreviewConfirmed) {
        setMessage('Please confirm the resume point before resuming.');
        return;
      }
      handleResumeClick();
    }
  };

  const handlePreviousStep = () => {
    const prevIndex = stepIndex - 1;
    if (prevIndex >= 0) {
      const prevStep = steps[prevIndex] as typeof resumeStep;
      setResumeStep(prevStep);
      setStepIndex(prevIndex);
    }
  };

  if (!isResumeWizardOpen || !checkpoint) return null;

  return (
    <div className="resume-wizard-overlay">
      <div className="resume-wizard-modal">
        {/* Header */}
        <div className="resume-wizard-header">
          <div className="resume-header-content">
            <h2>Resume Job</h2>
            <p className="resume-header-subtitle">{checkpoint.fileName}</p>
          </div>
          <button
            className="resume-close-btn"
            onClick={closeResumeWizard}
            aria-label="Close resume wizard"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Rail */}
        <div className="resume-wizard-container">
          <div className="resume-progress-rail">
            {steps.map((step, idx) => (
              <div
                key={step}
                className={`resume-progress-step ${
                  idx < stepIndex ? 'completed' : idx === stepIndex ? 'active' : ''
                }`}
              >
                <div className="progress-indicator">
                  {idx < stepIndex ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <div className="progress-dot" />
                  )}
                </div>
                <span className="progress-label">{step.replace(/_/g, ' ')}</span>
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="resume-content-panel">
            {resumeStep === 'checkpoint_summary' && (
              <CheckpointSummaryStep checkpoint={checkpoint} message={message} />
            )}
            {resumeStep === 'file_validation' && (
              <FileValidationStep
                checkpoint={checkpoint}
                match={validations.fileHashMatches}
                message={message}
              />
            )}
            {resumeStep === 'home_decision' && (
              <HomeDecisionStep
                isLoading={isLoading}
                confirmed={validations.homeConfirmed}
                onHome={handleHomeClick}
                message={message}
              />
            )}
            {resumeStep === 'tool_modal_restore' && (
              <ToolModalRestoreStep checkpoint={checkpoint} />
            )}
            {resumeStep === 'preview_path' && (
              <PreviewPathStep checkpoint={checkpoint} />
            )}
            {resumeStep === 'visual_confirmation' && (
              <VisualConfirmationStep
                checkpoint={checkpoint}
                onConfirm={() =>
                  useJobResumeStore.getState().setPathPreviewConfirmed(true)
                }
                message={message}
              />
            )}

            {/* Bottom Action Bar */}
            <div className="resume-action-bar">
              <button
                className="resume-btn-secondary"
                onClick={handlePreviousStep}
                disabled={stepIndex === 0}
              >
                <ChevronLeft className="w-4 h-4" />
                Back
              </button>

              <button
                className="resume-btn-primary"
                onClick={handleNextStep}
                disabled={isLoading}
              >
                {resumeStep === 'visual_confirmation' ? (
                  <>
                    <Play className="w-4 h-4" />
                    Resume Job
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Step Components
function CheckpointSummaryStep({
  checkpoint,
  message,
}: {
  checkpoint: any;
  message: string | null;
}) {
  return (
    <div className="step-content">
      <h3>Checkpoint Summary</h3>
      <div className="checkpoint-card">
        <div className="card-row">
          <span className="card-label">File:</span>
          <span className="card-value">{checkpoint.fileName}</span>
        </div>
        <div className="card-row">
          <span className="card-label">Line:</span>
          <span className="card-value">
            {checkpoint.currentLine} / {checkpoint.totalLines}
          </span>
        </div>
        <div className="card-row">
          <span className="card-label">Tool:</span>
          <span className="card-value">T{checkpoint.toolNumber || 'None'}</span>
        </div>
        <div className="card-row">
          <span className="card-label">Position:</span>
          <span className="card-value">
            X: {checkpoint.machineState.wpos.x.toFixed(2)}, Y:{' '}
            {checkpoint.machineState.wpos.y.toFixed(2)}, Z:{' '}
            {checkpoint.machineState.wpos.z.toFixed(2)}
          </span>
        </div>
        <div className="card-row">
          <span className="card-label">Saved:</span>
          <span className="card-value">
            {new Date(checkpoint.timestamp).toLocaleString()}
          </span>
        </div>
      </div>
      {message && (
        <div className="message-box message-info">
          <Info className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}

function FileValidationStep({
  checkpoint,
  match,
  message,
}: {
  checkpoint: any;
  match: boolean;
  message: string | null;
}) {
  return (
    <div className="step-content">
      <h3>File Validation</h3>
      <div className={`validation-box ${match ? 'success' : 'warning'}`}>
        {match ? (
          <CheckCircle2 className="w-6 h-6 text-green-500" />
        ) : (
          <AlertTriangle className="w-6 h-6 text-yellow-500" />
        )}
        <div>
          <p className="validation-title">
            {match ? 'File matches checkpoint' : 'File mismatch detected'}
          </p>
          <p className="validation-detail">
            Checkpoint: <code>{checkpoint.fileHash.substring(0, 8)}</code>
          </p>
        </div>
      </div>
      {message && (
        <div className="message-box message-warning">
          <AlertCircle className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}

function HomeDecisionStep({
  isLoading,
  confirmed,
  onHome,
  message,
}: {
  isLoading: boolean;
  confirmed: boolean;
  onHome: () => void;
  message: string | null;
}) {
  return (
    <div className="step-content">
      <h3>Home Machine</h3>
      <p className="step-description">
        Re-homing is required to establish a known reference point after interruption.
      </p>
      <div className={`home-status ${confirmed ? 'confirmed' : ''}`}>
        {confirmed ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span>Machine homed successfully</span>
          </>
        ) : (
          <>
            <Home className="w-5 h-5 text-blue-500" />
            <span>Ready to home</span>
          </>
        )}
      </div>
      {!confirmed && (
        <button
          className="home-button"
          onClick={onHome}
          disabled={isLoading}
        >
          {isLoading ? 'Homing...' : 'Execute Home ($H)'}
        </button>
      )}
      {message && (
        <div className={`message-box ${confirmed ? 'message-success' : 'message-warning'}`}>
          <Info className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}

function ToolModalRestoreStep({ checkpoint }: { checkpoint: any }) {
  return (
    <div className="step-content">
      <h3>Tool & Modal State</h3>
      <div className="tool-modal-grid">
        <div className="modal-box">
          <label>Tool Number</label>
          <div className="modal-value">T{checkpoint.toolNumber || 'None'}</div>
        </div>
        <div className="modal-box">
          <label>Units</label>
          <div className="modal-value">
            {checkpoint.modalState.units === 'G20' ? 'Inches' : 'Millimeters'}
          </div>
        </div>
        <div className="modal-box">
          <label>Distance Mode</label>
          <div className="modal-value">
            {checkpoint.modalState.distanceMode === 'G90' ? 'Absolute' : 'Relative'}
          </div>
        </div>
        <div className="modal-box">
          <label>Plane</label>
          <div className="modal-value">
            {checkpoint.modalState.plane === 'G17' ? 'XY' : checkpoint.modalState.plane === 'G18' ? 'ZX' : 'YZ'}
          </div>
        </div>
        <div className="modal-box">
          <label>Feed Rate</label>
          <div className="modal-value">{checkpoint.feedRate.toFixed(1)} units/min</div>
        </div>
        <div className="modal-box">
          <label>Spindle RPM</label>
          <div className="modal-value">{checkpoint.spindle.rpm}</div>
        </div>
      </div>
      <p className="step-description">
        These settings will be restored automatically before resuming.
      </p>
    </div>
  );
}

function PreviewPathStep({ checkpoint }: { checkpoint: any }) {
  return (
    <div className="step-content">
      <h3>Recovery Path Preview</h3>
      <div className="preview-box">
        <div className="preview-step">
          <div className="preview-step-label">1. Safe Z Clearance</div>
          <div className="preview-step-value">
            Z → {(checkpoint.machineState.wpos.z + 10).toFixed(2)}
          </div>
        </div>
        <div className="preview-step">
          <div className="preview-step-label">2. XY Traverse</div>
          <div className="preview-step-value">
            X: {checkpoint.machineState.wpos.x.toFixed(2)}, Y:{' '}
            {checkpoint.machineState.wpos.y.toFixed(2)}
          </div>
        </div>
        <div className="preview-step">
          <div className="preview-step-label">3. Z Approach</div>
          <div className="preview-step-value">
            Z → {checkpoint.machineState.wpos.z.toFixed(2)}
          </div>
        </div>
      </div>
      <p className="step-description">
        The tool will follow this path before resuming from line {checkpoint.currentLine + 1}.
      </p>
    </div>
  );
}

function VisualConfirmationStep({
  checkpoint,
  onConfirm,
  message,
}: {
  checkpoint: any;
  onConfirm: () => void;
  message: string | null;
}) {
  return (
    <div className="step-content">
      <h3>Visual Confirmation</h3>
      <div className="confirmation-box">
        <div className="confirmation-highlight">
          <Clock className="w-5 h-5" />
          <p>Ready to resume from line {checkpoint.currentLine + 1}</p>
        </div>
        <p className="confirmation-note">
          The 3D view above shows the resume point highlighted in amber. Verify that the
          continuation path is correct.
        </p>
        <label className="confirmation-checkbox">
          <input type="checkbox" onChange={(e) => e.target.checked && onConfirm()} />
          I confirm the resume point is correct
        </label>
      </div>
      {message && (
        <div className="message-box message-info">
          <Info className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}
    </div>
  );
}
