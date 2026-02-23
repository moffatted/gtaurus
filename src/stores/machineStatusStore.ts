import { create } from 'zustand';

interface AxisState {
    mpos: number;
    wco: number;
}

interface MachineStatus {
    status: string;
    x: AxisState;
    y: AxisState;
    z: AxisState;
    feed: number;
    spindle: number;
    isSpindleActive?: boolean;
    firmware: string;
    buildInfo: string;
    board: string;
}

interface MachineStatusState {
    machine: MachineStatus;
    updateMachine: (partial: Partial<MachineStatus>) => void;
    updateAxis: (axis: 'x' | 'y' | 'z', partial: Partial<AxisState>) => void;
    resetMachine: () => void;
}

export const useMachineStatusStore = create<MachineStatusState>((set) => ({
    machine: {
        status: 'Disconnected',
        x: { mpos: 0, wco: 0 },
        y: { mpos: 0, wco: 0 },
        z: { mpos: 0, wco: 0 },
        feed: 0,
        spindle: 0,
        isSpindleActive: false,
        firmware: 'Unknown',
        buildInfo: 'Unknown',
        board: 'Unknown',
    },
    updateMachine: (partial) => set((state) => ({
        machine: { ...state.machine, ...partial }
    })),
    updateAxis: (axis, partial) => set((state) => ({
        machine: {
            ...state.machine,
            [axis]: { ...state.machine[axis], ...partial }
        }
    })),
    resetMachine: () => set({
        machine: {
            status: 'Disconnected',
            x: { mpos: 0, wco: 0 },
            y: { mpos: 0, wco: 0 },
            z: { mpos: 0, wco: 0 },
            feed: 0,
            spindle: 0,
            firmware: 'Unknown',
            buildInfo: 'Unknown',
            board: 'Unknown',
        }
    }),
}));
