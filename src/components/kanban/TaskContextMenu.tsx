import { useEffect, useRef } from 'react';
import { useSelectionStore } from '@/stores';
import { Trash2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TaskContextMenuProps {
  onDelete: (taskIds: string[]) => void;
  onDuplicate?: (taskId: string) => void;
}

export function TaskContextMenu({ onDelete, onDuplicate }: TaskContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { contextMenu, closeContextMenu, selectedTaskIds } = useSelectionStore();

  // Determine which tasks the context menu applies to:
  // - If tasks are selected and the right-clicked task is in the selection, use selection
  // - Otherwise, use just the right-clicked task
  const rightClickedTaskId = contextMenu.taskId;
  const useSelection = selectedTaskIds.size > 0 && rightClickedTaskId && selectedTaskIds.has(rightClickedTaskId);
  const targetTaskIds = useSelection
    ? Array.from(selectedTaskIds)
    : (rightClickedTaskId ? [rightClickedTaskId] : []);
  const targetCount = targetTaskIds.length;

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        closeContextMenu();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeContextMenu();
      }
    };

    if (contextMenu.isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [contextMenu.isOpen, closeContextMenu]);

  // Adjust position if menu would go off screen
  useEffect(() => {
    if (contextMenu.isOpen && menuRef.current) {
      const menu = menuRef.current;
      const rect = menu.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      let x = contextMenu.x;
      let y = contextMenu.y;

      // Adjust horizontal position
      if (x + rect.width > viewportWidth - 10) {
        x = viewportWidth - rect.width - 10;
      }

      // Adjust vertical position
      if (y + rect.height > viewportHeight - 10) {
        y = viewportHeight - rect.height - 10;
      }

      menu.style.left = `${x}px`;
      menu.style.top = `${y}px`;
    }
  }, [contextMenu.isOpen, contextMenu.x, contextMenu.y]);

  if (!contextMenu.isOpen || targetCount === 0) return null;

  const handleDelete = () => {
    onDelete(targetTaskIds);
    closeContextMenu();
  };

  const handleDuplicate = () => {
    if (onDuplicate && rightClickedTaskId) {
      onDuplicate(rightClickedTaskId);
    }
    closeContextMenu();
  };

  return (
    <div
      ref={menuRef}
      className="fixed z-50 min-w-[160px] overflow-hidden rounded-lg border bg-popover p-1 shadow-premium-lg animate-in fade-in-0 zoom-in-95"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
      }}
    >
      {/* Delete option */}
      <button
        onClick={handleDelete}
        className={cn(
          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm',
          'text-destructive hover:bg-destructive/10 focus:bg-destructive/10 focus:outline-none'
        )}
      >
        <Trash2 className="h-4 w-4" />
        Delete{targetCount > 1 ? ` ${targetCount} tasks` : ''}
      </button>

      {/* Duplicate option - only show for single task */}
      {targetCount === 1 && onDuplicate && (
        <button
          onClick={handleDuplicate}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm',
            'hover:bg-accent focus:bg-accent focus:outline-none'
          )}
        >
          <Copy className="h-4 w-4" />
          Duplicate
        </button>
      )}
    </div>
  );
}
