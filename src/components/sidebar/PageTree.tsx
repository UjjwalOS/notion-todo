import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import { usePages } from '@/hooks';
import { PageTreeItem } from './PageTreeItem';
import { ConfirmDialog } from '@/components/ui';
import type { PageWithChildren } from '@/types';
import { Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface RenameModalProps {
  page: PageWithChildren;
  onClose: () => void;
  onSave: (id: string, title: string, icon: string | null) => void;
}

function RenameModal({ page, onClose, onSave }: RenameModalProps) {
  const [title, setTitle] = useState(page.title);
  const [icon, setIcon] = useState(page.icon || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(page.id, title, icon || null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-sm rounded-lg bg-[var(--color-bg-primary)] p-4 shadow-xl">
        <h3 className="mb-4 text-lg font-semibold text-[var(--color-text-primary)]">
          Rename Page
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[var(--color-text-secondary)]">
              Icon (emoji)
            </label>
            <input
              type="text"
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="📄"
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm"
              maxLength={2}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--color-text-secondary)]">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm text-[var(--color-on-accent)] hover:bg-[var(--color-accent-hover)]"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function PageTree() {
  const navigate = useNavigate();
  const location = useLocation();
  const { pageTree, isLoading, createPage, updatePage, deletePage, reorderPages } = usePages();
  const [renamingPage, setRenamingPage] = useState<PageWithChildren | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    page: PageWithChildren | null;
    hasContent: boolean;
  }>({ isOpen: false, page: null, hasContent: false });

  // Drag and drop state
  const [draggedPageId, setDraggedPageId] = useState<string | null>(null);
  const [dragOverPageId, setDragOverPageId] = useState<string | null>(null);

  const handleCreatePage = async () => {
    const result = await createPage({
      title: 'Untitled',
      parent_id: null,
    });
    if (!result) {
      toast.error('Failed to create page');
    }
  };

  const handleRename = async (id: string, title: string, icon: string | null) => {
    const success = await updatePage({ id, title, icon });
    if (!success) {
      toast.error('Failed to rename page');
    }
  };

  // Check if a page has any content (tasks or subpages)
  const checkPageHasContent = async (page: PageWithChildren): Promise<boolean> => {
    // Check for subpages (already in memory)
    if (page.children && page.children.length > 0) {
      return true;
    }

    // Check for tasks in database (quick count query)
    const { count, error } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true })
      .eq('page_id', page.id)
      .eq('is_deleted', false);

    if (error) {
      console.error('Error checking page content:', error);
      return true; // Assume has content on error to be safe
    }

    return (count ?? 0) > 0;
  };

  const handleDelete = async (page: PageWithChildren) => {
    // Check if page has content
    const hasContent = await checkPageHasContent(page);

    if (hasContent) {
      // Show confirmation dialog
      setDeleteConfirmation({ isOpen: true, page, hasContent: true });
    } else {
      // Delete directly without confirmation
      await executeDelete(page);
    }
  };

  const executeDelete = async (page: PageWithChildren) => {
    // Check if we're currently viewing the page being deleted (or one of its children)
    const currentPath = location.pathname;
    const isViewingDeletedPage = currentPath === `/page/${page.id}` ||
      currentPath.startsWith(`/page/${page.id}/`);

    // Also check if viewing a child page of the deleted page
    const isViewingChildPage = page.children?.some(child =>
      currentPath === `/page/${child.id}` || currentPath.startsWith(`/page/${child.id}/`)
    );

    const success = await deletePage(page.id);
    if (success) {
      toast.success('Page deleted');

      // Navigate away if we were viewing the deleted page or its children
      if (isViewingDeletedPage || isViewingChildPage) {
        // Navigate to first available page or home
        const remainingPages = pageTree.filter(p => p.id !== page.id);
        if (remainingPages.length > 0) {
          navigate(`/page/${remainingPages[0].id}`);
        } else {
          navigate('/');
        }
      }
    } else {
      toast.error('Failed to delete page');
    }
    setDeleteConfirmation({ isOpen: false, page: null, hasContent: false });
  };

  const handleDuplicate = async (page: PageWithChildren) => {
    const result = await createPage({
      title: `${page.title} (copy)`,
      parent_id: page.parent_id,
      icon: page.icon,
    });
    if (!result) {
      toast.error('Failed to duplicate page');
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, pageId: string) => {
    setDraggedPageId(pageId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', pageId);
  };

  const handleDragOver = (e: React.DragEvent, pageId: string) => {
    e.preventDefault();
    if (draggedPageId && draggedPageId !== pageId) {
      setDragOverPageId(pageId);
    }
  };

  const handleDragEnd = () => {
    setDraggedPageId(null);
    setDragOverPageId(null);
  };

  const handleDrop = async (e: React.DragEvent, targetPageId: string) => {
    e.preventDefault();

    if (!draggedPageId || draggedPageId === targetPageId) {
      handleDragEnd();
      return;
    }

    // Find the index of the target page
    const targetIndex = pageTree.findIndex(p => p.id === targetPageId);

    if (targetIndex !== -1) {
      const success = await reorderPages(draggedPageId, null, targetIndex);
      if (!success) {
        toast.error('Failed to reorder page');
      }
    }

    handleDragEnd();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 size={20} className="animate-spin text-[var(--color-text-tertiary)]" />
      </div>
    );
  }

  return (
    <div>
      {pageTree.length === 0 ? (
        <div className="px-2 py-4 text-center">
          <p className="mb-3 text-sm text-[var(--color-text-tertiary)]">
            No pages yet
          </p>
          <button
            onClick={() => handleCreatePage()}
            className="inline-flex items-center gap-1 rounded-md bg-[var(--color-accent)] px-3 py-1.5 text-sm text-[var(--color-on-accent)] hover:bg-[var(--color-accent-hover)]"
          >
            <Plus size={14} />
            Create your first page
          </button>
        </div>
      ) : (
        <>
          {pageTree.map((page) => (
            <PageTreeItem
              key={page.id}
              page={page}
              onRename={setRenamingPage}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDragEnd={handleDragEnd}
              onDrop={handleDrop}
              isDragging={draggedPageId !== null}
              dragOverId={dragOverPageId}
            />
          ))}
          <button
            onClick={() => handleCreatePage()}
            className="mt-1 flex w-full items-center gap-2 rounded-md py-1 px-2 text-sm text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-secondary)]"
          >
            <Plus size={16} className="flex-shrink-0" />
            <span>Add page</span>
          </button>
        </>
      )}

      {renamingPage && (
        <RenameModal
          page={renamingPage}
          onClose={() => setRenamingPage(null)}
          onSave={handleRename}
        />
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteConfirmation.isOpen}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteConfirmation({ isOpen: false, page: null, hasContent: false });
          }
        }}
        title={`Delete "${deleteConfirmation.page?.title || 'page'}"?`}
        description={
          deleteConfirmation.page?.children && deleteConfirmation.page.children.length > 0
            ? 'This page has subpages. Deleting it will also delete all subpages and their content.'
            : 'This page has content. Deleting it will permanently remove all tasks and data.'
        }
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={() => deleteConfirmation.page && executeDelete(deleteConfirmation.page)}
        onCancel={() => setDeleteConfirmation({ isOpen: false, page: null, hasContent: false })}
      />
    </div>
  );
}
