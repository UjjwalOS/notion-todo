import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Column, ColumnInsert, ColumnUpdate } from '@/types';

export function useColumns(pageId: string | null) {
  const [columns, setColumns] = useState<Column[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch columns for a page
  const fetchColumns = useCallback(async () => {
    if (!pageId) {
      setColumns([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('columns')
        .select('*')
        .eq('page_id', pageId)
        .order('position', { ascending: true });

      if (fetchError) throw fetchError;
      setColumns(data || []);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [pageId]);

  // Initial fetch
  useEffect(() => {
    fetchColumns();
  }, [fetchColumns]);

  // Create a new column
  const createColumn = async (data: Omit<ColumnInsert, 'page_id'>): Promise<Column | null> => {
    if (!pageId) return null;

    try {
      // Get the next position
      const maxPosition = columns.reduce((max, c) => Math.max(max, c.position), -1);

      const { data: newColumn, error: createError } = await supabase
        .from('columns')
        .insert({
          ...data,
          page_id: pageId,
          position: data.position ?? maxPosition + 1,
        })
        .select()
        .single();

      if (createError) throw createError;

      setColumns((prev) => [...prev, newColumn].sort((a, b) => a.position - b.position));
      return newColumn;
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  };

  // Update a column
  const updateColumn = async (data: ColumnUpdate): Promise<boolean> => {
    try {
      const { id, ...updates } = data;
      const { error: updateError } = await supabase
        .from('columns')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      setColumns((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  // Delete a column
  const deleteColumn = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('columns')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setColumns((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  // Reorder columns
  const reorderColumns = async (columnId: string, newPosition: number): Promise<boolean> => {
    const currentIndex = columns.findIndex((c) => c.id === columnId);
    if (currentIndex === -1) return false;

    // Calculate new order
    const newColumns = [...columns];
    const [removed] = newColumns.splice(currentIndex, 1);
    newColumns.splice(newPosition, 0, removed);
    const reorderedColumns = newColumns.map((col, index) => ({ ...col, position: index }));

    // Store previous state for rollback
    const previousColumns = [...columns];

    // OPTIMISTIC UPDATE: Update UI immediately
    setColumns(reorderedColumns);

    try {
      // Prepare batch update payload - include all NOT NULL fields required by upsert
      const updates = reorderedColumns.map((col) => ({
        id: col.id,
        page_id: col.page_id,
        title: col.title,
        color: col.color,
        position: col.position,
      }));

      // Single batch upsert instead of N individual updates
      const { error: updateError } = await supabase
        .from('columns')
        .upsert(updates, { onConflict: 'id' });

      if (updateError) throw updateError;

      return true;
    } catch (err) {
      // Rollback on failure
      setColumns(previousColumns);
      setError((err as Error).message);
      return false;
    }
  };

  // Create default columns for a new page
  const createDefaultColumns = async (): Promise<boolean> => {
    if (!pageId) return false;

    try {
      const defaultColumns = [
        { title: 'Inbox', color: '#e3e2e0', position: 0 },
        { title: '/', color: '#9e9e9e', position: 1 },
        { title: '3', color: '#ef5350', position: 2 },
        { title: '2', color: '#ff9800', position: 3 },
        { title: '1', color: '#ffeb3b', position: 4 },
        { title: 'In Progress', color: '#f5a623', position: 5 },
        { title: '/', color: '#9e9e9e', position: 6 },
        { title: 'Done', color: '#4caf50', position: 7 },
        { title: 'Shared with Tense', color: '#7c4dff', position: 8 },
      ];

      const { data: newColumns, error: createError } = await supabase
        .from('columns')
        .insert(defaultColumns.map((c) => ({ ...c, page_id: pageId })))
        .select();

      if (createError) throw createError;

      setColumns(newColumns || []);
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  return {
    columns,
    isLoading,
    error,
    fetchColumns,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    createDefaultColumns,
  };
}
