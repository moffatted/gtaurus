import { describe, it, expect, beforeEach } from 'vitest';
import { useMachineStore } from './machineStore';

describe('machineStore', () => {
  beforeEach(() => {
    useMachineStore.getState().resetPrerequisites();
  });

  it('should initialize with hasHomed and hasZeroed as false', () => {
    const state = useMachineStore.getState();
    expect(state.hasHomed).toBe(false);
    expect(state.hasZeroed).toBe(false);
  });

  it('should update hasHomed', () => {
    useMachineStore.getState().setHasHomed(true);
    expect(useMachineStore.getState().hasHomed).toBe(true);
  });

  it('should update hasZeroed', () => {
    useMachineStore.getState().setHasZeroed(true);
    expect(useMachineStore.getState().hasZeroed).toBe(true);
  });

  it('should reset prerequisites', () => {
    useMachineStore.getState().setHasHomed(true);
    useMachineStore.getState().setHasZeroed(true);
    useMachineStore.getState().resetPrerequisites();
    
    expect(useMachineStore.getState().hasHomed).toBe(false);
    expect(useMachineStore.getState().hasZeroed).toBe(false);
  });
});
