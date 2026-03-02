import { describe, it, expect } from 'vitest';
import { useWizardStore } from './wizardStore';

describe('wizardStore', () => {
    it('should open and close the carve wizard', () => {
        expect(useWizardStore.getState().isCarveWizardOpen).toBe(false);
        useWizardStore.getState().openCarveWizard();
        expect(useWizardStore.getState().isCarveWizardOpen).toBe(true);
        useWizardStore.getState().closeCarveWizard();
        expect(useWizardStore.getState().isCarveWizardOpen).toBe(false);
    });
});
