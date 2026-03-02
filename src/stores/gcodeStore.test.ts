import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGcodeStore } from './gcodeStore';

describe('gcodeStore', () => {
    beforeEach(() => {
        useGcodeStore.getState().reset();
    });

    it('should initialize with default state', () => {
        const state = useGcodeStore.getState();
        expect(state.gcode).toBe('');
        expect(state.simulatedPath).toEqual([]);
        expect(state.bounds).toBeNull();
    });

    it('should parse tool number from G-code', () => {
        const gcode = 'G21\nT1 M6\nG0 X10 Y10';
        useGcodeStore.getState().setGcode(gcode, 'test.nc');
        expect(useGcodeStore.getState().fileToolNumber).toBe(1);
    });

    it('should calculate bounds correctly (G21 - Metric)', () => {
        const gcode = 'G21\nG0 X0 Y0 Z0\nG1 X10 Y20 Z-5\nG1 X5 Y30 Z2';
        useGcodeStore.getState().setGcode(gcode);
        const bounds = useGcodeStore.getState().bounds;
        expect(bounds).toEqual({
            minX: 0, maxX: 10,
            minY: 0, maxY: 30,
            minZ: -5, maxZ: 2
        });
    });

    it('should calculate bounds with G20 (Inches to Metric conversion)', () => {
        const gcode = 'G20\nG0 X0 Y0\nG1 X1 Y1'; // 1 inch = 25.4mm
        useGcodeStore.getState().setGcode(gcode);
        const bounds = useGcodeStore.getState().bounds;
        expect(bounds?.maxX).toBe(25.4);
        expect(bounds?.maxY).toBe(25.4);
    });

    it('should handle G91 (Relative) in bounds calculation', () => {
        const gcode = 'G21\nG90\nG0 X10 Y10\nG91\nG1 X5 Y-5'; // Moves to 10,10 then to 15,5
        useGcodeStore.getState().setGcode(gcode);
        const bounds = useGcodeStore.getState().bounds;
        expect(bounds?.maxX).toBe(15);
        expect(bounds?.minY).toBe(0); // Because path starts at 0,0
    });

    it('should add actual points with de-duplication', () => {
        const store = useGcodeStore.getState();
        store.addActualPoint({ x: 0, y: 0, z: 0, isRapid: true });
        store.addActualPoint({ x: 0.01, y: 0.01, z: 0.01, isRapid: true }); // Too close
        store.addActualPoint({ x: 1, y: 1, z: 1, isRapid: true });

        expect(useGcodeStore.getState().actualPath.length).toBe(2);
    });

    it('should clear actual path', () => {
        useGcodeStore.getState().addActualPoint({ x: 1, y: 1, z: 1, isRapid: true });
        useGcodeStore.getState().clearActualPath();
        expect(useGcodeStore.getState().actualPath.length).toBe(0);
    });

    it('should run simulation and populate simulatedPath', async () => {
        vi.useFakeTimers();
        const gcode = 'G21\nG0 X10 Y10\nG1 X20 Y20';
        const store = useGcodeStore.getState();
        store.setGcode(gcode);
        
        const simPromise = store.simulate();
        
        // Advance timers to trigger the simulation loop
        await vi.advanceTimersByTimeAsync(600); // Initial 500ms delay + some simulation steps
        await vi.advanceTimersByTimeAsync(2000); // Finish simulation
        
        await simPromise;
        
        const state = useGcodeStore.getState();
        expect(state.simulatedPath.length).toBe(2);
        expect(state.simPos).toEqual({ x: 20, y: 20, z: 0, isRapid: false });
        expect(state.isSimulating).toBe(false);
        
        vi.useRealTimers();
    });
});
