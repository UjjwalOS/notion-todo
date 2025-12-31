import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // Sidebar state
  sidebarCollapsed: boolean;
  sidebarHidden: boolean;
  expandedPageIds: string[];

  // Modal state
  taskModalOpen: boolean;
  taskModalTaskId: string | null;
  taskModalSidePanelOpen: boolean;

  // Command palette
  commandPaletteOpen: boolean;

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarHidden: () => void;
  setSidebarHidden: (hidden: boolean) => void;
  togglePageExpanded: (pageId: string) => void;
  setPageExpanded: (pageId: string, expanded: boolean) => void;

  openTaskModal: (taskId: string | null) => void;
  closeTaskModal: () => void;
  toggleTaskModalSidePanel: () => void;

  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  toggleCommandPalette: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      sidebarCollapsed: false,
      sidebarHidden: false,
      expandedPageIds: [],
      taskModalOpen: false,
      taskModalTaskId: null,
      taskModalSidePanelOpen: true,
      commandPaletteOpen: false,

      // Sidebar actions
      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      toggleSidebarHidden: () =>
        set((state) => ({ sidebarHidden: !state.sidebarHidden })),

      setSidebarHidden: (hidden) => set({ sidebarHidden: hidden }),

      togglePageExpanded: (pageId) => {
        const { expandedPageIds } = get();
        const isExpanded = expandedPageIds.includes(pageId);
        set({
          expandedPageIds: isExpanded
            ? expandedPageIds.filter((id) => id !== pageId)
            : [...expandedPageIds, pageId],
        });
      },

      setPageExpanded: (pageId, expanded) => {
        const { expandedPageIds } = get();
        const isExpanded = expandedPageIds.includes(pageId);
        if (expanded && !isExpanded) {
          set({ expandedPageIds: [...expandedPageIds, pageId] });
        } else if (!expanded && isExpanded) {
          set({ expandedPageIds: expandedPageIds.filter((id) => id !== pageId) });
        }
      },

      // Task modal actions
      openTaskModal: (taskId) =>
        set({
          taskModalOpen: true,
          taskModalTaskId: taskId,
        }),

      closeTaskModal: () =>
        set({
          taskModalOpen: false,
          taskModalTaskId: null,
        }),

      toggleTaskModalSidePanel: () =>
        set((state) => ({
          taskModalSidePanelOpen: !state.taskModalSidePanelOpen,
        })),

      // Command palette actions
      openCommandPalette: () => set({ commandPaletteOpen: true }),
      closeCommandPalette: () => set({ commandPaletteOpen: false }),
      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen })),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        sidebarHidden: state.sidebarHidden,
        expandedPageIds: state.expandedPageIds,
        taskModalSidePanelOpen: state.taskModalSidePanelOpen,
      }),
    }
  )
);
