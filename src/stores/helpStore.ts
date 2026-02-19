import { create } from 'zustand';

interface HelpState {
  isOpen: boolean;
  activeTopic: string;
  open: (topic?: string) => void;
  close: () => void;
  toggle: () => void;
  setTopic: (topic: string) => void;
}

export const useHelpStore = create<HelpState>((set) => ({
  isOpen: false,
  activeTopic: 'getting-started',
  open: (topic) => set((state) => ({ isOpen: true, activeTopic: topic || state.activeTopic })),
  close: () => set({ isOpen: false }),
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  setTopic: (topic) => set({ activeTopic: topic }),
}));
