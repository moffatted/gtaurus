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
  const { activeFileName, gcode } = useGcodeStore();
  
  const [stepIndex, setStepIndex] = useState(0);
  const [modalRestoreComplete, setModalRestoreComplete] = useState(false);
  const [safeZApproachComplete, setSafeZApproachComplete] = useState(false);
  const [hasCollisionDetected, setHasCollisionDetected] = useState(false);
  const [highlightedLineRange, setHighlightedLineRange] = useState({ start: -1, end: -1 });

  const steps = [
    'checkpoint_summary',
    'machine_status_check',
    'file_validation',
    'home_decision',
    'tool_modal_restore',
    'safe_z_approach',
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

  // Restore modal state (G-code mode commands)
  const handleRestoreModalState = async () => {
    if (!checkpoint) return;
    setIsLoading(true);
    try {
      const commands: string[] = [];
      const modal = checkpoint.modalState;

      // Restore units (G20=inches, G21=mm)
      commands.push(modal.units === 'G20' ? 'G20' : 'G21');
      
      // Restore distance mode (G90=absolute, G91=relative)
      commands.push(modal.distanceMode === 'G90' ? 'G90' : 'G91');
      
      // Restore plane (G17=XY, G18=ZX, G19=YZ)
      commands.push(modal.plane || 'G17');
      
      // Restore motion mode (typically G0 or G1)
      commands.push(modal.motionMode || 'G0');
      
      // Restore feed rate mode (G93=inv time, G94=per min, G95=per rev)
      commands.push(modal.feedMode || 'G94');

      // Send all commands
      for (const cmd of commands) {
        await transport.invoke('send_command', { command: cmd });
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      setModalRestoreComplete(true);
      setMessage('Modal state restored.');
      setTimeout(() => {
        setResumeStep('safe_z_approach');
        setStepIndex(steps.indexOf('safe_z_approach'));
      }, 1000);
    } catch (e) {
      setMessage(`Modal restore failed: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute safe Z approach: Z clearance → XY traverse → Z plunge
  const handleSafeZApproach = async () => {
    if (!checkpoint) return;
    setIsLoading(true);
    try {
      const checkpoint_z = checkpoint.machineState.wpos.z || 0;
      const clearance_height = checkpoint_z + 10; // 10mm clearance
      const resume_x = checkpoint.machineState.wpos.x || 0;
      const resume_y = checkpoint.machineState.wpos.y || 0;

      // Stage 1: Move to safe Z height (rapid)
      setMessage(`Moving to safe Z height (${clearance_height.toFixed(1)} mm)...`);
      await transport.invoke('send_command', { 
        command: `G0 Z${clearance_height.toFixed(3)}` 
      });
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stage 2: Rapid XY to last position
      setMessage(`Moving to resume position (X${resume_x.toFixed(1)}, Y${resume_y.toFixed(1)})...`);
      await transport.invoke('send_command', { 
        command: `G0 X${resume_x.toFixed(3)} Y${resume_y.toFixed(3)}` 
      });
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stage 3: Plunge Z back down to resume height
      setMessage(`Plunging to resume height (${checkpoint_z.toFixed(1)} mm)...`);
      await transport.invoke('send_command', { 
        command: `G1 Z${checkpoint_z.toFixed(3)} F${checkpoint.feedRate.toFixed(0)}` 
      });
      await new Promise(resolve => setTimeout(resolve, 500));

      setSafeZApproachComplete(true);
      setMessage('Safe Z approach complete.');
      setTimeout(() => {
        setResumeStep('preview_path');
        setStepIndex(steps.indexOf('preview_path'));
      }, 1000);
    } catch (e) {
      setMessage(`Safe Z approach failed: ${e}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Analyze toolpath for collision and highlight resume segment
  const analyzeToolpath = () => {
    if (!checkpoint || !gcode) return;

    try {
      const lines = gcode.split('\n');
      const resumeLine = checkpoint.currentLine;
      const previewLineCount = Math.min(resumeLine + 50, lines.length);

      // Set highlight range for 3D visualization
      setHighlightedLineRange({
        start: resumeLine,
        end: previewLineCount,
      });

      // Simple collision detection: check for Z coordinates lower than approach height
      let hasCollision = false;
      const safeZHeight = checkpoint.machineState.wpos.z + 10;

      for (let i = resumeLine; i < previewLineCount; i++) {
        const line = lines[i]?.trim() || '';
        if (line.match(/^G1\s+[XY]/)) {
          // Check if there's a Z coordinate in this line that's below safe height
          if (line.match(/Z-?\d+\.?\d*/)) {
            const zMatch = line.match(/Z(-?\d+\.?\d*)/);
            if (zMatch) {
              const zVal = parseFloat(zMatch[1]);
              if (zVal < safeZHeight - 5) { // 5mm tolerance
                hasCollision = true;
                break;
              }
            }
          }
        }
      }

      setHasCollisionDetected(hasCollision);
      if (hasCollision) {
        setMessage('⚠️ Warning: Potential collision detected in toolpath. Review the path carefully.');
      } else {
        setMessage('✓ No collision detected in preview segment.');
      }
    } catch (e) {
      console.error('Toolpath analysis error:', e);
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
      handleRestoreModalState();
    } else if (resumeStep === 'safe_z_approach') {
      handleSafeZApproach();
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
              <ToolModalRestoreStep 
                checkpoint={checkpoint} 
                isLoading={isLoading}
                onRestore={handleRestoreModalState}
                isComplete={modalRestoreComplete}
              />
            )}
            {resumeStep === 'safe_z_approach' && (
              <SafeZApproachStep 
                checkpoint={checkpoint}
                isLoading={isLoading}
                onApproach={handleSafeZApproach}
                isComplete={safeZApproachComplete}
                message={message}
              />
            )}
            {resumeStep === 'preview_path' && (
              <PreviewPathStep 
                checkpoint={checkpoint}
                highlightRange={highlightedLineRange}
                hasCollision={hasCollisionDetected}
                onAnalyze={analyzeToolpath}
                message={message}
              />
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

function ToolModalRestoreStep({ 
  checkpoint, 
  isLoading,
  onRestore,
  isComplete
}: { 
  checkpoint: any;
  isLoading: boolean;
  onRestore: () => void;
  isComplete: boolean;
}) {
  return (
    <div className="step-content">
      <h3>Tool & Modal State Restoration</h3>
      <div className="tool-modal-grid">
        <div className="modal-box">
          <label>Tool Number</label>
          <div className="modal-value">T{checkpoint.toolNumber || 'None'}</div>
        </div>
        <div className="modal-box">
          <label>Units</label>
          <div className="modal-value">
            {checkpoint.modalState.units === 'G20' ? 'Inches (G20)' : 'Millimeters (G21)'}
          </div>
        </div>
        <div className="modal-box">
          <label>Distance Mode</label>
          <div className="modal-value">
            {checkpoint.modalState.distanceMode === 'G90' ? 'Absolute (G90)' : 'Relative (G91)'}
          </div>
        </div>
        <div className="modal-box">
          <label>Plane</label>
          <div className="modal-value">
            {checkpoint.modalState.plane === 'G17' ? 'XY (G17)' : checkpoint.modalState.plane === 'G18' ? 'ZX (G18)' : 'YZ (G19)'}
          </div>
        </div>
        <div className="modal-box">
          <label>Feed Rate Mode</label>
          <div className="modal-value">{checkpoint.modalState.feedMode || 'G94'}</div>
        </div>
        <div className="modal-box">
          <label>Spindle RPM</label>
          <div className="modal-value">{checkpoint.spindle.rpm.toFixed(0)}</div>
        </div>
      </div>
      <p className="step-description">
        Click "Restore Modal State" to send G-code commands that restore these settings.
      </p>
      {!isComplete && (
        <button 
          onClick={onRestore}
          disabled={isLoading}
          className="modal-restore-btn"
        >
          {isLoading ? 'Restoring...' : 'Restore Modal State'}
        </button>
      )}
      {isComplete && (
        <div className="message-box message-success">
          <CheckCircle2 className="w-4 h-4" />
          <span>Modal state restored successfully</span>
        </div>
      )}
    </div>
  );
}

function SafeZApproachStep({ 
  checkpoint,
  isLoading,
  onApproach,
  isComplete,
  message
}: { 
  checkpoint: any;
  isLoading: boolean;
  onApproach: () => void;
  isComplete: boolean;
  message: string | null;
}) {
  const clearanceHeight = checkpoint.machineState.wpos.z + 10;
  
  return (
    <div className="step-content">
      <h3>Safe Z Approach Sequence</h3>
      <p className="step-description">
        Execute a safe 3-stage approach to reach the resume position:
      </p>
      <div className="preview-box">
        <div className="preview-step">
          <div className="preview-step-label">🔷 Stage 1: Safe Z Clearance</div>
          <div className="preview-step-value">
            Rapid move to Z = {clearanceHeight.toFixed(2)} mm
          </div>
        </div>
        <div className="preview-step">
          <div className="preview-step-label">🔷 Stage 2: XY Traverse</div>
          <div className="preview-step-value">
            Rapid to X = {checkpoint.machineState.wpos.x.toFixed(2)} mm, Y = {checkpoint.machineState.wpos.y.toFixed(2)} mm
          </div>
        </div>
        <div className="preview-step">
          <div className="preview-step-label">🔷 Stage 3: Z Plunge</div>
          <div className="preview-step-value">
            Feed move to Z = {checkpoint.machineState.wpos.z.toFixed(2)} mm at F{checkpoint.feedRate.toFixed(0)}
          </div>
        </div>
      </div>
      {message && (
        <div className={`message-box ${message.includes('⚠') ? 'message-warning' : message.includes('Warning') ? 'message-warning' : 'message-info'}`}>
          <Info className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}
      {!isComplete && (
        <button 
          onClick={onApproach}
          disabled={isLoading}
          className="modal-restore-btn"
        >
          {isLoading ? 'Executing...' : 'Execute Safe Z Approach'}
        </button>
      )}
      {isComplete && (
        <div className="message-box message-success">
          <CheckCircle2 className="w-4 h-4" />
          <span>Safe Z approach complete</span>
        </div>
      )}
    </div>
  );
}

function PreviewPathStep({ 
  checkpoint,
  highlightRange,
  hasCollision,
  onAnalyze,
  message
}: { 
  checkpoint: any;
  highlightRange: { start: number; end: number };
  hasCollision: boolean;
  onAnalyze: () => void;
  message: string | null;
}) {
  return (
    <div className="step-content">
      <h3>Toolpath Analysis & Collision Detection</h3>
      <p className="step-description">
        Analyze the resumed toolpath and check for potential collisions with the stock:
      </p>
      <div className="preview-box">
        <div className="preview-step">
          <div className="preview-step-label">Resume from Line</div>
          <div className="preview-step-value">
            {checkpoint.currentLine + 1} of {checkpoint.totalLines}
          </div>
        </div>
        <div className="preview-step">
          <div className="preview-step-label">Preview Segment</div>
          <div className="preview-step-value">
            {highlightRange.start > -1 ? `Lines ${highlightRange.start + 1} → ${highlightRange.end + 1}` : 'Not analyzed yet'}
          </div>
        </div>
        <div className="preview-step">
          <div className="preview-step-label">Collision Status</div>
          <div className={`preview-step-value ${hasCollision ? 'collision-warning' : 'collision-safe'}`}>
            {hasCollision ? '⚠️ High Collision Risk' : '✓ No Collision Detected'}
          </div>
        </div>
      </div>
      {message && (
        <div className={`message-box ${message.includes('⚠') || message.includes('Warning') ? 'message-warning' : 'message-success'}`}>
          <AlertCircle className="w-4 h-4" />
          <span>{message}</span>
        </div>
      )}
      {highlightRange.start === -1 && (
        <button 
          onClick={onAnalyze}
          className="modal-restore-btn"
        >
          Analyze Toolpath
        </button>
      )}
      {highlightRange.start > -1 && (
        <div className="toolpath-highlight-info">
          <p className="highlight-text">
            📍 3D view segment highlighted in <span style={{color: '#FFA500'}}>amber</span> from line {highlightRange.start + 1}
          </p>
        </div>
      )}
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
