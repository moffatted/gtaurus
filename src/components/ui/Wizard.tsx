/**
 * @file Wizard.tsx
 * @purpose Reusable multi-step wizard framework with progress tracking and navigation logic.
 */
import { ReactNode, useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronLeft, ChevronRight, Check } from 'lucide-react';

export interface WizardStep {
  id: string;
  title: string;
  component: ReactNode;
  canProceed?: boolean;
  onEnter?: () => void;
  onExit?: () => void;
}

interface WizardProps {
  isOpen: boolean;
  onClose: () => void;
  steps: WizardStep[];
  title: string;
  finalLabel?: string;
  heroImage?: string;
}

export function Wizard({ isOpen, onClose, steps, title, finalLabel, heroImage }: WizardProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const currentStep = steps[currentStepIndex];
  
  // Reset index when wizard opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStepIndex(0);
    }
  }, [isOpen]);

  // Execute onEnter when step changes
  useEffect(() => {
    if (isOpen && currentStep?.onEnter) {
      currentStep.onEnter();
    }
  }, [currentStepIndex, isOpen]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep?.onExit) currentStep.onExit();
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      onClose();
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  return createPortal(
    <div className="fixed inset-0 z-[11000] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className={`bg-[var(--bg-secondary)] border border-[var(--border-color)] w-full ${heroImage ? 'max-w-4xl' : 'max-w-2xl'} rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 mx-4`}
        style={{ maxHeight: 'min(800px, 90vh)' }}
      >
        <div className="flex flex-1 overflow-hidden min-h-[400px]">
          {/* Optional Hero Image Side Panel */}
          {heroImage && (
            <div className="w-1/3 border-r border-[var(--border-color)] bg-[var(--bg-primary)] hidden md:block shrink-0 relative overflow-hidden">
               <img src={heroImage} alt="Wizard illustration" className="absolute inset-0 w-full h-full object-cover opacity-90 transition-transform duration-[10s] hover:scale-110" />
               <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-secondary)]/90 via-transparent to-[var(--accent-primary)]/20" />
            </div>
          )}

          {/* Main Content Area */}
          <div className="flex flex-col flex-1 overflow-hidden relative">
            {/* Header */}
            <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--bg-primary)]/50">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>
                <p className="text-xs text-[var(--text-tertiary)] mt-1 uppercase tracking-widest font-medium">
                  Step {currentStepIndex + 1} of {steps.length} — {currentStep.title}
                </p>
              </div>
              <button 
                onClick={onClose}
                className="p-2 rounded-full hover:bg-[var(--hover-bg)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="h-1 w-full bg-[var(--border-color)]">
              <div 
                className="h-full bg-blue-500 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 min-h-[400px]">
              {currentStep.component}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-[var(--border-color)] bg-[var(--bg-primary)]/30 flex items-center justify-between">
              <button
                onClick={handleBack}
                disabled={currentStepIndex === 0}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all
                  ${currentStepIndex === 0 
                    ? 'opacity-0 pointer-events-none' 
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover-bg)] active:scale-95'}
                `}
              >
                <ChevronLeft className="w-5 h-5" />
                Back
              </button>

          <button
            onClick={handleNext}
            disabled={currentStep.canProceed === false}
            className={`
              flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all shadow-lg
              ${currentStep.canProceed === false
                ? 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95 shadow-blue-500/20'}
            `}
          >
            {currentStepIndex === steps.length - 1 ? (
              <>
                {finalLabel || 'Finish'}
                <Check className="w-5 h-5" />
              </>
            ) : (
              <>
                Next
                <ChevronRight className="w-5 h-5" />
              </>
            )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
