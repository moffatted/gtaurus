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

    it('should open/close/toggle FluidNC Manager', () => {
        useUIStore.getState().openFluidNCManager();
        expect(useUIStore.getState().fluidNCManagerOpen).toBe(true);
        useUIStore.getState().closeFluidNCManager();
        expect(useUIStore.getState().fluidNCManagerOpen).toBe(false);
        useUIStore.getState().toggleFluidNCManager();
        expect(useUIStore.getState().fluidNCManagerOpen).toBe(true);
    });

    it('should open/close/toggle Machine Stats', () => {
        useUIStore.getState().openMachineStats();
        expect(useUIStore.getState().machineStatsOpen).toBe(true);
        useUIStore.getState().closeMachineStats();
        expect(useUIStore.getState().machineStatsOpen).toBe(false);
        useUIStore.getState().toggleMachineStats();
        expect(useUIStore.getState().machineStatsOpen).toBe(true);
    });

    it('should open/close/toggle Tool Changer', () => {
        useUIStore.getState().openToolChanger();
        expect(useUIStore.getState().toolChangerOpen).toBe(true);
        useUIStore.getState().closeToolChanger();
        expect(useUIStore.getState().toolChangerOpen).toBe(false);
        useUIStore.getState().toggleToolChanger();
        expect(useUIStore.getState().toolChangerOpen).toBe(true);
    });

    it('should open/close/toggle Tool Library', () => {
        useUIStore.getState().openToolLibrary();
        expect(useUIStore.getState().toolLibraryOpen).toBe(true);
        useUIStore.getState().closeToolLibrary();
        expect(useUIStore.getState().toolLibraryOpen).toBe(false);
        useUIStore.getState().toggleToolLibrary();
        expect(useUIStore.getState().toolLibraryOpen).toBe(true);
    });

    it('should open/close/toggle Camera Viewer', () => {
        useUIStore.getState().openCameraViewer();
        expect(useUIStore.getState().cameraViewerOpen).toBe(true);
        useUIStore.getState().closeCameraViewer();
        expect(useUIStore.getState().cameraViewerOpen).toBe(false);
        useUIStore.getState().toggleCameraViewer();
        expect(useUIStore.getState().cameraViewerOpen).toBe(true);
    });

    it('should set settings section', () => {
        useUIStore.getState().setSettingsSection('probing');
        expect(useUIStore.getState().settingsSection).toBe('probing');
        useUIStore.getState().setSettingsSection(null);
        expect(useUIStore.getState().settingsSection).toBeNull();
    });

    it('bringToFront should increase z-index above current max', () => {
        const before = useUIStore.getState().zIndexMap;
        const maxBefore = Math.max(...Object.values(before));
        useUIStore.getState().bringToFront('aiAssistant');
        const after = useUIStore.getState().zIndexMap;
        expect(after.aiAssistant).toBeGreaterThan(maxBefore);
    });
});
