/**
 * @file wizardStore.ts
 * @purpose Manages the open/close state of setup wizards like the Carve Wizard.
 */
import { create } from 'zustand';

interface WizardState {
  isCarveWizardOpen: boolean;
  openCarveWizard: () => void;
  closeCarveWizard: () => void;
  isSurfacingWizardOpen: boolean;
  openSurfacingWizard: () => void;
  closeSurfacingWizard: () => void;
}

export const useWizardStore = create<WizardState>((set) => ({
  isCarveWizardOpen: false,
  openCarveWizard: () => set({ isCarveWizardOpen: true }),
  closeCarveWizard: () => set({ isCarveWizardOpen: false }),
  isSurfacingWizardOpen: false,
  openSurfacingWizard: () => set({ isSurfacingWizardOpen: true }),
  closeSurfacingWizard: () => set({ isSurfacingWizardOpen: false }),
}));
