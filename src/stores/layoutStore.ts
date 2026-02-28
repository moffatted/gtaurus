/**
 * @file layoutStore.ts
 * @purpose Manages and persists the state of UI layout components, such as sidebar collapse and panel visibility.
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LayoutState {
  panels: {
    console: boolean;
    controls: boolean;
    manager: boolean;
  };
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  togglePanel: (panel: keyof LayoutState['panels']) => void;
  setPanelVisibility: (panel: keyof LayoutState['panels'], visible: boolean) => void;
  // Initialize with at least one panel visible if all are closed?
  initLayout: () => void;
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      panels: {
        console: true,
        controls: false,
        manager: false,
      },
      sidebarCollapsed: false,
      toggleSidebarCollapsed: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      togglePanel: (panel) =>
        set((state) => {
          const newPanels = { ...state.panels, [panel]: !state.panels[panel] };
          // Ensure at least one panel remains visible? 
          // If turning off the last visible panel, maybe prevent it or just let it be empty?
          // User said "up to 3". 0 is probably bad UX.
          const visibleCount = Object.values(newPanels).filter(Boolean).length;
          if (visibleCount === 0) {
             // If trying to close the last one, keep it open?
             // Or maybe just let it close and show a "Open a panel" message?
             // Let's prevent closing the last one for now to avoid empty state confusion.
             if (!state.panels[panel]) return {}; // actively opening, so visibleCount is > 0
             return { panels: state.panels }; // cancel close
          }
          return { panels: newPanels };
        }),
      setPanelVisibility: (panel, visible) =>
        set((state) => {
             const newPanels = { ...state.panels, [panel]: visible };
             const visibleCount = Object.values(newPanels).filter(Boolean).length;
             if (visibleCount === 0 && !visible) return { panels: state.panels };
             return { panels: newPanels };
        }),
      initLayout: () => {
          // Check if valid? Persist middleware handles rehydration.
      }
    }),
    {
      name: 'layout-storage',
    }
  )
);
