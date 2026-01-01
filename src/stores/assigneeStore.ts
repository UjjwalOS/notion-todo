import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Assignee {
  id: string;
  name: string;
  color: string;
}

// Predefined colors for assignees (will cycle through)
const ASSIGNEE_COLORS = [
  '#3b82f6', // blue
  '#8b5cf6', // violet
  '#ec4899', // pink
  '#f97316', // orange
  '#10b981', // emerald
  '#06b6d4', // cyan
  '#6366f1', // indigo
  '#f43f5e', // rose
];

interface AssigneeStore {
  assignees: Assignee[];
  addAssignee: (name: string) => Assignee;
  removeAssignee: (id: string) => void;
  getAssigneeById: (id: string) => Assignee | undefined;
  getAssigneeByName: (name: string) => Assignee | undefined;
}

export const useAssigneeStore = create<AssigneeStore>()(
  persist(
    (set, get) => ({
      assignees: [],

      addAssignee: (name: string) => {
        const trimmedName = name.trim();
        if (!trimmedName) {
          throw new Error('Name cannot be empty');
        }

        // Check if assignee already exists
        const existing = get().assignees.find(
          (a) => a.name.toLowerCase() === trimmedName.toLowerCase()
        );
        if (existing) {
          return existing;
        }

        // Create new assignee with color
        const colorIndex = get().assignees.length % ASSIGNEE_COLORS.length;
        const newAssignee: Assignee = {
          id: crypto.randomUUID(),
          name: trimmedName,
          color: ASSIGNEE_COLORS[colorIndex],
        };

        set((state) => ({
          assignees: [...state.assignees, newAssignee],
        }));

        return newAssignee;
      },

      removeAssignee: (id: string) => {
        set((state) => ({
          assignees: state.assignees.filter((a) => a.id !== id),
        }));
      },

      getAssigneeById: (id: string) => {
        return get().assignees.find((a) => a.id === id);
      },

      getAssigneeByName: (name: string) => {
        return get().assignees.find(
          (a) => a.name.toLowerCase() === name.toLowerCase()
        );
      },
    }),
    {
      name: 'assignees-storage',
    }
  )
);
