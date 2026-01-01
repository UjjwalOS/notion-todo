import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores';
import type { Comment, CommentInsert, CommentUpdate } from '@/types';

interface UseCommentsOptions {
  taskId: string | null;
}

export function useComments({ taskId }: UseCommentsOptions) {
  const { user } = useAuthStore();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch comments for a task
  const fetchComments = useCallback(async () => {
    if (!taskId) {
      setComments([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('comments')
        .select('*')
        .eq('task_id', taskId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (fetchError) throw fetchError;
      setComments(data || []);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  // Initial fetch
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Create a new comment
  const createComment = async (data: Omit<CommentInsert, 'user_id'>): Promise<Comment | null> => {
    if (!user) return null;

    try {
      const { data: newComment, error: createError } = await supabase
        .from('comments')
        .insert({
          ...data,
          user_id: user.id,
        })
        .select()
        .single();

      if (createError) {
        console.error('Failed to create comment:', createError.message);
        throw createError;
      }

      setComments((prev) => [...prev, newComment]);
      return newComment;
    } catch (err) {
      const errorMessage = (err as Error).message;
      console.error('Comment creation error:', errorMessage);
      setError(errorMessage);
      return null;
    }
  };

  // Update a comment
  const updateComment = async (data: CommentUpdate): Promise<boolean> => {
    try {
      const { id, ...updates } = data;
      const { error: updateError } = await supabase
        .from('comments')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      setComments((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c))
      );
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  // Soft delete a comment
  const deleteComment = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('comments')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (deleteError) throw deleteError;

      setComments((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  return {
    comments,
    commentCount: comments.length,
    isLoading,
    error,
    fetchComments,
    createComment,
    updateComment,
    deleteComment,
  };
}
