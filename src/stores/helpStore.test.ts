import { describe, it, expect, beforeEach } from 'vitest';
import { useHelpStore } from './helpStore';

describe('helpStore', () => {
  beforeEach(() => {
    useHelpStore.setState({ isOpen: false, activeTopic: 'getting-started' });
  });

  it('starts closed with default topic', () => {
    const state = useHelpStore.getState();
    expect(state.isOpen).toBe(false);
    expect(state.activeTopic).toBe('getting-started');
  });

  it('open() sets isOpen to true and keeps current topic when no topic given', () => {
    useHelpStore.setState({ activeTopic: 'probing' });
    useHelpStore.getState().open();
    const state = useHelpStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.activeTopic).toBe('probing');
  });

  it('open(topic) sets isOpen and updates topic', () => {
    useHelpStore.getState().open('job-resume');
    const state = useHelpStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.activeTopic).toBe('job-resume');
  });

  it('close() sets isOpen to false', () => {
    useHelpStore.setState({ isOpen: true });
    useHelpStore.getState().close();
    expect(useHelpStore.getState().isOpen).toBe(false);
  });

  it('toggle() opens when closed', () => {
    useHelpStore.getState().toggle();
    expect(useHelpStore.getState().isOpen).toBe(true);
  });

  it('toggle() closes when open', () => {
    useHelpStore.setState({ isOpen: true });
    useHelpStore.getState().toggle();
    expect(useHelpStore.getState().isOpen).toBe(false);
  });

  it('setTopic() updates the active topic without changing isOpen', () => {
    useHelpStore.setState({ isOpen: false, activeTopic: 'getting-started' });
    useHelpStore.getState().setTopic('surfacing');
    const state = useHelpStore.getState();
    expect(state.activeTopic).toBe('surfacing');
    expect(state.isOpen).toBe(false);
  });
});
