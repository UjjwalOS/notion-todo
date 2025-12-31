import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores';
import type { Page, PageInsert, PageUpdate, PageWithChildren } from '@/types';

export function usePages() {
  const { user } = useAuthStore();
  const [pages, setPages] = useState<Page[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all pages for the current user
  const fetchPages = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error: fetchError } = await supabase
        .from('pages')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_deleted', false)
        .order('position', { ascending: true });

      if (fetchError) throw fetchError;
      setPages(data || []);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Initial fetch
  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  // Build tree structure from flat pages
  const buildPageTree = useCallback((): PageWithChildren[] => {
    const pageMap = new Map<string, PageWithChildren>();
    const roots: PageWithChildren[] = [];

    // Create map of all pages
    pages.forEach((page) => {
      pageMap.set(page.id, { ...page, children: [] });
    });

    // Build tree
    pages.forEach((page) => {
      const node = pageMap.get(page.id)!;
      if (page.parent_id && pageMap.has(page.parent_id)) {
        pageMap.get(page.parent_id)!.children!.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort children by position
    const sortChildren = (nodes: PageWithChildren[]) => {
      nodes.sort((a, b) => a.position - b.position);
      nodes.forEach((node) => {
        if (node.children?.length) {
          sortChildren(node.children);
        }
      });
    };
    sortChildren(roots);

    return roots;
  }, [pages]);

  // Create a new page
  const createPage = async (data: Omit<PageInsert, 'user_id'>): Promise<Page | null> => {
    if (!user) return null;

    try {
      // Get the next position
      const siblingPages = pages.filter((p) => p.parent_id === data.parent_id);
      const maxPosition = siblingPages.reduce((max, p) => Math.max(max, p.position), -1);

      const { data: newPage, error: createError } = await supabase
        .from('pages')
        .insert({
          ...data,
          user_id: user.id,
          position: data.position ?? maxPosition + 1,
        })
        .select()
        .single();

      if (createError) throw createError;

      setPages((prev) => [...prev, newPage]);
      return newPage;
    } catch (err) {
      setError((err as Error).message);
      return null;
    }
  };

  // Update a page
  const updatePage = async (data: PageUpdate): Promise<boolean> => {
    try {
      const { id, ...updates } = data;
      const { error: updateError } = await supabase
        .from('pages')
        .update(updates)
        .eq('id', id);

      if (updateError) throw updateError;

      setPages((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
      );
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  // Move page to trash (soft delete)
  const deletePage = async (id: string): Promise<boolean> => {
    try {
      const { error: deleteError } = await supabase
        .from('pages')
        .update({
          is_deleted: true,
          deleted_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (deleteError) throw deleteError;

      // Also soft-delete all children
      const childIds = getDescendantIds(id);
      if (childIds.length > 0) {
        await supabase
          .from('pages')
          .update({
            is_deleted: true,
            deleted_at: new Date().toISOString(),
          })
          .in('id', childIds);
      }

      setPages((prev) =>
        prev.filter((p) => p.id !== id && !childIds.includes(p.id))
      );
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  // Get all descendant IDs of a page
  const getDescendantIds = (pageId: string): string[] => {
    const descendants: string[] = [];
    const findChildren = (parentId: string) => {
      pages.forEach((p) => {
        if (p.parent_id === parentId) {
          descendants.push(p.id);
          findChildren(p.id);
        }
      });
    };
    findChildren(pageId);
    return descendants;
  };

  // Reorder pages
  const reorderPages = async (
    pageId: string,
    newParentId: string | null,
    newPosition: number
  ): Promise<boolean> => {
    try {
      // Get siblings at the new location
      const siblings = pages.filter(
        (p) => p.parent_id === newParentId && p.id !== pageId
      );

      // Update positions
      const updates: { id: string; position: number; parent_id: string | null }[] = [];

      siblings.forEach((sibling, index) => {
        const newPos = index >= newPosition ? index + 1 : index;
        if (sibling.position !== newPos) {
          updates.push({ id: sibling.id, position: newPos, parent_id: newParentId });
        }
      });

      updates.push({ id: pageId, position: newPosition, parent_id: newParentId });

      // Batch update
      for (const update of updates) {
        await supabase
          .from('pages')
          .update({ position: update.position, parent_id: update.parent_id })
          .eq('id', update.id);
      }

      // Update local state
      setPages((prev) =>
        prev.map((p) => {
          const update = updates.find((u) => u.id === p.id);
          return update ? { ...p, position: update.position, parent_id: update.parent_id } : p;
        })
      );

      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    }
  };

  return {
    pages,
    pageTree: buildPageTree(),
    isLoading,
    error,
    fetchPages,
    createPage,
    updatePage,
    deletePage,
    reorderPages,
  };
}
