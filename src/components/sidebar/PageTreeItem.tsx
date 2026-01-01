import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import type { PageWithChildren } from '@/types';
import {
  FileText,
  Pencil,
  Trash2,
  Copy,
} from 'lucide-react';

// Context menu position type
interface MenuPosition {
  x: number;
  y: number;
}

interface PageTreeItemProps {
  page: PageWithChildren;
  onRename: (page: PageWithChildren) => void;
  onDelete: (page: PageWithChildren) => void;
  onDuplicate: (page: PageWithChildren) => void;
  onDragStart: (e: React.DragEvent, pageId: string) => void;
  onDragOver: (e: React.DragEvent, pageId: string) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent, pageId: string) => void;
  isDragging: boolean;
  dragOverId: string | null;
}

export function PageTreeItem({
  page,
  onRename,
  onDelete,
  onDuplicate,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  isDragging,
  dragOverId,
}: PageTreeItemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [contextMenuPos, setContextMenuPos] = useState<MenuPosition | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isActive = location.pathname === `/page/${page.id}`;

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (contextMenuPos && menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setContextMenuPos(null);
      }
    };

    if (contextMenuPos) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenuPos]);

  // Handle right-click context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenuPos({ x: e.clientX, y: e.clientY });
  };

  const handleClick = () => {
    navigate(`/page/${page.id}`);
  };

  const handleMenuAction = (action: () => void) => {
    action();
    setContextMenuPos(null);
  };

  const isBeingDragged = isDragging && dragOverId === page.id;

  return (
    <>
      <div
        draggable
        onDragStart={(e) => onDragStart(e, page.id)}
        onDragOver={(e) => onDragOver(e, page.id)}
        onDragEnd={onDragEnd}
        onDrop={(e) => onDrop(e, page.id)}
        className={cn(
          'flex items-center gap-2 rounded-md py-1 px-2 text-sm cursor-pointer select-none',
          isActive
            ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]'
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]',
          isBeingDragged && 'border-t-2 border-[var(--color-accent)]'
        )}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Icon */}
        <span className="flex-shrink-0">
          {page.icon ? (
            <span className="text-base leading-none">{page.icon}</span>
          ) : (
            <FileText size={16} className="text-[var(--color-text-tertiary)]" />
          )}
        </span>

        {/* Title */}
        <span className="flex-1 truncate">{page.title || 'Untitled'}</span>
      </div>

      {/* Right-click context menu */}
      {contextMenuPos && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setContextMenuPos(null)}
          />
          <div
            ref={menuRef}
            className="fixed z-50 w-40 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] py-1 shadow-lg"
            style={{
              left: contextMenuPos.x,
              top: contextMenuPos.y,
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMenuAction(() => onRename(page));
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
            >
              <Pencil size={14} />
              Rename
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMenuAction(() => onDuplicate(page));
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
            >
              <Copy size={14} />
              Duplicate
            </button>
            <div className="my-1 border-t border-[var(--color-border)]" />
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleMenuAction(() => onDelete(page));
              }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-danger)] hover:bg-[var(--color-bg-hover)]"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </>
      )}
    </>
  );
}
