import { describe, it, expect, beforeEach } from 'vitest';
import { useMachineStatusStore } from './machineStatusStore';

describe('machineStatusStore', () => {
    beforeEach(() => {
        useMachineStatusStore.getState().resetMachine();
    });

    it('should have initial state', () => {
        const state = useMachineStatusStore.getState();
        expect(state.machine.status).toBe('Disconnected');
        expect(state.machine.x.mpos).toBe(0);
        expect(state.machine.y.mpos).toBe(0);
        expect(state.machine.z.mpos).toBe(0);
    });

    it('should update machine level status', () => {
        useMachineStatusStore.getState().updateMachine({ status: 'Idle', firmware: 'FluidNC 3.1' });
        const state = useMachineStatusStore.getState();
        expect(state.machine.status).toBe('Idle');
        expect(state.machine.firmware).toBe('FluidNC 3.1');
    });

    it('should update individual axes', () => {
        useMachineStatusStore.getState().updateAxis('x', { mpos: 123.456, wco: 10 });
        const state = useMachineStatusStore.getState();
        expect(state.machine.x.mpos).toBe(123.456);
        expect(state.machine.x.wco).toBe(10);
        // Ensure other axes are untouched
        expect(state.machine.y.mpos).toBe(0);
    });

    it('should reset machine state', () => {
        useMachineStatusStore.getState().updateMachine({ status: 'Alarm' });
        useMachineStatusStore.getState().resetMachine();
        const state = useMachineStatusStore.getState();
        expect(state.machine.status).toBe('Disconnected');
    });
});
