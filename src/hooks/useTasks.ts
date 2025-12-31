import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores';
import type { Task, TaskInsert, TaskUpdate } from '@/types';

interface UseTasksOptions {
  pageId?: string | null;
  columnId?: string | null;
  includeDeleted?: boolean;
}

export function useTasks(options: UseTasksOptions = {}) {
  const { pageId, columnId, includeDeleted = false } = options;
  const { user } = useAuthStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      let query = supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id)
        .order('position', { ascending: true });

      if (pageId) {
        query = query.eq('page_id', pageId);
      }

      if (columnId) {
        query = query.eq('column_id', columnId);
      }

      if (!includeDeleted) {
        query = query.eq('is_deleted', false);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;
      setTasks(data || []);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [user, pageId, columnId, includeDeleted]);

  // Initial fetch
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Create a new task
  const createTask = async (data: Omit<TaskInsert, 'user_id'>): Promise<Task | null> => {
    if (!user) return null;

    try {
      // Get the next position (at top of column)
      const columnTasks = tasks.filter((t) => t.column_id === data.column_id);

      // Shift existing tasks down
      const updates = columnTasks.map((t) => ({
        id: t.id,
        position: t.position + 1,
      }));

      for (const update of updates) {
        await supabase
          .from('tasks')
          .update({ position: update.position })
          .eq('id', update.id);
      }

      const { data: newTask, error: createError } = await supabase
        .from('tasks')
        .insert({
          ...data,
          user_id: user.id,
          position: 0, // New tasks at top
        })
        .select()
        .single();

      if (createError) throw createError;

      // Update local state
      setTasks((prev) => [
        newTask,
        ...prev.map((t) =>
          t.column_id === data.column_id ? { ...t, position: t.position + 1 } : t
        ),
      ]);

      return newTask;
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  };

  // Update a task
  const updateTask = async (data: TaskUpdate): Promise<boolean> => {
    try {
      const { id, ...updates } = data;
      const { error: updateError } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
      );
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  // Move task to trash (soft delete)
  const deleteTask = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (deleteError) throw deleteError;

      setTasks((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  // Permanently delete a task
  const permanentlyDeleteTask = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setTasks((prev) => prev.filter((t) => t.id !== id));
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  // Restore a task from trash
  const restoreTask = async (id: string): Promise<boolean> => {
    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({
          is_deleted: false,
          deleted_at: null,
        })
        .eq('id', id);

      if (updateError) throw updateError;

      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, is_deleted: false, deleted_at: null } : t
        )
      );
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  // Move task to a different column
  const moveTask = async (
    taskId: string,
    targetColumnId: string,
    targetPosition: number
  ): Promise<boolean> => {
    try {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return false;

      const sourceColumnId = task.column_id;
      const isMovingWithinColumn = sourceColumnId === targetColumnId;

      // Get tasks in target column
      const targetColumnTasks = tasks
        .filter((t) => t.column_id === targetColumnId && t.id !== taskId)
        .sort((a, b) => a.position - b.position);

      // Calculate new positions
      const updates: { id: string; position: number; column_id?: string }[] = [];

      // Insert task at target position
      targetColumnTasks.splice(targetPosition, 0, { ...task, column_id: targetColumnId });

      // Update positions for target column
      targetColumnTasks.forEach((t, index) => {
        if (t.id === taskId) {
          updates.push({
            id: taskId,
            position: index,
            column_id: targetColumnId,
          });
        } else if (t.position !== index) {
          updates.push({ id: t.id, position: index });
        }
      });

      // If moving between columns, also update source column positions
      if (!isMovingWithinColumn) {
        const sourceColumnTasks = tasks
          .filter((t) => t.column_id === sourceColumnId && t.id !== taskId)
          .sort((a, b) => a.position - b.position);

        sourceColumnTasks.forEach((t, index) => {
          if (t.position !== index) {
            updates.push({ id: t.id, position: index });
          }
        });

        // TODO: Handle "Done" column automation
        // Would need to look up column title and set completed_at if moving to Done
      }

      // Apply updates
      for (const update of updates) {
        const updateData: { position: number; column_id?: string; completed_at?: string | null } = {
          position: update.position,
        };
        if (update.column_id) {
          updateData.column_id = update.column_id;
        }

        await supabase
          .from('tasks')
          .update(updateData)
          .eq('id', update.id);
      }

      // Update local state
      setTasks((prev) =>
        prev.map((t) => {
          const update = updates.find((u) => u.id === t.id);
          if (update) {
            return {
              ...t,
              position: update.position,
              column_id: update.column_id ?? t.column_id,
            };
          }
          return t;
        })
      );

      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  // Duplicate a task
  const duplicateTask = async (id: string): Promise<Task | null> => {
    const task = tasks.find((t) => t.id === id);
    if (!task || !user) return null;

    return createTask({
      page_id: task.page_id,
      column_id: task.column_id,
      title: `${task.title} (copy)`,
      content: task.content,
      priority: task.priority,
      due_date: task.due_date,
    });
  };

  // Get tasks grouped by column
  const getTasksByColumn = useCallback((): Record<string, Task[]> => {
    const grouped: Record<string, Task[]> = {};
    tasks.forEach((task) => {
      if (!grouped[task.column_id]) {
        grouped[task.column_id] = [];
      }
      grouped[task.column_id].push(task);
    });
    // Sort each group by position
    Object.values(grouped).forEach((group) => {
      group.sort((a, b) => a.position - b.position);
    });
    return grouped;
  }, [tasks]);

  return {
    tasks,
    tasksByColumn: getTasksByColumn(),
    isLoading,
    error,
    fetchTasks,
    createTask,
    updateTask,
    deleteTask,
    permanentlyDeleteTask,
    restoreTask,
    moveTask,
    duplicateTask,
  };
}
