import { create } from 'zustand';

interface SelectionState {
  // Selected task IDs
  selectedTaskIds: Set<string>;

  // Context menu state
  contextMenu: {
    isOpen: boolean;
    x: number;
    y: number;
    taskId: string | null;
  };

  // Actions
  selectTask: (taskId: string, addToSelection?: boolean) => void;
  deselectTask: (taskId: string) => void;
  toggleTaskSelection: (taskId: string) => void;
  selectMultipleTasks: (taskIds: string[]) => void;
  clearSelection: () => void;
  isSelected: (taskId: string) => boolean;

  // Context menu actions
  openContextMenu: (x: number, y: number, taskId: string) => void;
  closeContextMenu: () => void;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedTaskIds: new Set(),
  contextMenu: {
    isOpen: false,
    x: 0,
    y: 0,
    taskId: null,
  },

  selectTask: (taskId, addToSelection = false) => {
    set((state) => {
      const newSelection = addToSelection
        ? new Set(state.selectedTaskIds)
        : new Set<string>();
      newSelection.add(taskId);
      return { selectedTaskIds: newSelection };
    });
  },

  deselectTask: (taskId) => {
    set((state) => {
      const newSelection = new Set(state.selectedTaskIds);
      newSelection.delete(taskId);
      return { selectedTaskIds: newSelection };
    });
  },

  toggleTaskSelection: (taskId) => {
    set((state) => {
      const newSelection = new Set(state.selectedTaskIds);
      if (newSelection.has(taskId)) {
        newSelection.delete(taskId);
      } else {
        newSelection.add(taskId);
      }
      return { selectedTaskIds: newSelection };
    });
  },

  selectMultipleTasks: (taskIds) => {
    set({ selectedTaskIds: new Set(taskIds) });
  },

  clearSelection: () => {
    set({ selectedTaskIds: new Set() });
  },

  isSelected: (taskId) => {
    return get().selectedTaskIds.has(taskId);
  },

  openContextMenu: (x, y, taskId) => {
    // Just open context menu, don't auto-select
    // The context menu will work on the right-clicked task
    set({
      contextMenu: { isOpen: true, x, y, taskId },
    });
  },

  closeContextMenu: () => {
    set({
      contextMenu: { isOpen: false, x: 0, y: 0, taskId: null },
    });
  },
}));
