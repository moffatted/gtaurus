import { create } from 'zustand';

interface MachineState {
  hasHomed: boolean;
  hasZeroed: boolean;
  setHasHomed: (val: boolean) => void;
  setHasZeroed: (val: boolean) => void;
  resetPrerequisites: () => void;
}

export const useMachineStore = create<MachineState>((set) => ({
  hasHomed: false,
  hasZeroed: false,
  setHasHomed: (val) => set({ hasHomed: val }),
  setHasZeroed: (val) => set({ hasZeroed: val }),
  resetPrerequisites: () => set({ hasHomed: false, hasZeroed: false }),
}));
