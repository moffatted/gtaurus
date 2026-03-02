import { describe, it, expect, beforeEach } from 'vitest';
import { useUIStore } from './uiStore';

describe('uiStore', () => {
    beforeEach(() => {
        useUIStore.setState({
            settingsOpen: false,
            settingsTab: 'dashboard',
            settingsSection: null,
            aiAssistantOpen: false,
        });
    });

    it('should open settings and set tab/section', () => {
        useUIStore.getState().openSettings('machine', 'general');
        const state = useUIStore.getState();
        expect(state.settingsOpen).toBe(true);
        expect(state.settingsTab).toBe('machine');
        expect(state.settingsSection).toBe('general');
    });

    it('should close settings and reset section', () => {
        useUIStore.getState().openSettings('ui', 'style');
        useUIStore.getState().closeSettings();
        const state = useUIStore.getState();
        expect(state.settingsOpen).toBe(false);
        expect(state.settingsSection).toBeNull();
    });

    it('should set settings tab', () => {
        useUIStore.getState().setSettingsTab('ui');
        expect(useUIStore.getState().settingsTab).toBe('ui');
    });

    it('should open/close AI Assistant', () => {
        useUIStore.getState().openAIAssistant();
        expect(useUIStore.getState().aiAssistantOpen).toBe(true);
        useUIStore.getState().closeAIAssistant();
        expect(useUIStore.getState().aiAssistantOpen).toBe(false);
    });

    it('should toggle AI Assistant', () => {
        useUIStore.getState().toggleAIAssistant();
        expect(useUIStore.getState().aiAssistantOpen).toBe(true);
        useUIStore.getState().toggleAIAssistant();
        expect(useUIStore.getState().aiAssistantOpen).toBe(false);
    });
});
