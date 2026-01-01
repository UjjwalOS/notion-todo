import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { cn } from '@/lib/utils';
import type { PageWithChildren } from '@/types';
import {
  ChevronRight,
  FileText,
  MoreHorizontal,
  Plus,
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
  depth?: number;
  onCreateSubpage: (parentId: string) => void;
  onRename: (page: PageWithChildren) => void;
  onDelete: (page: PageWithChildren) => void;
  onDuplicate: (page: PageWithChildren) => void;
}

export function PageTreeItem({
  page,
  depth = 0,
  onCreateSubpage,
  onRename,
  onDelete,
  onDuplicate,
}: PageTreeItemProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { expandedPageIds, togglePageExpanded } = useUIStore();
  const [showMenu, setShowMenu] = useState(false);
  const [contextMenuPos, setContextMenuPos] = useState<MenuPosition | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isExpanded = expandedPageIds.includes(page.id);
  const isActive = location.pathname === `/page/${page.id}`;
  const hasChildren = page.children && page.children.length > 0;

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
    setShowMenu(false); // Close dropdown if open
  };

  const handleClick = () => {
    navigate(`/page/${page.id}`);
  };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePageExpanded(page.id);
  };

  const handleMenuAction = (action: () => void) => {
    action();
    setShowMenu(false);
    setContextMenuPos(null);
  };

  // Reusable menu items component
  const MenuItems = ({ onAction }: { onAction: (action: () => void) => void }) => (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAction(() => onRename(page));
        }}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
      >
        <Pencil size={14} />
        Rename
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onAction(() => onDuplicate(page));
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
          onAction(() => onDelete(page));
        }}
        className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-danger)] hover:bg-[var(--color-bg-hover)]"
      >
        <Trash2 size={14} />
        Delete
      </button>
    </>
  );

  return (
    <div>
      <div
        className={cn(
          'group flex items-center gap-1 rounded-md py-1 pr-2 text-sm cursor-pointer',
          isActive
            ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]'
            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {/* Expand/collapse button */}
        <button
          onClick={handleToggleExpand}
          className={cn(
            'flex-shrink-0 rounded p-0.5 hover:bg-[var(--color-bg-tertiary)]',
            !hasChildren && 'invisible'
          )}
        >
          <ChevronRight
            size={14}
            className={cn(
              'text-[var(--color-text-tertiary)] transition-transform',
              isExpanded && 'rotate-90'
            )}
          />
        </button>

        {/* Icon */}
        <span className="flex-shrink-0 text-base">
          {page.icon || <FileText size={16} className="text-[var(--color-text-tertiary)]" />}
        </span>

        {/* Title */}
        <span className="flex-1 truncate">{page.title || 'Untitled'}</span>

        {/* Actions (visible on hover) */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreateSubpage(page.id);
            }}
            className="rounded p-1 hover:bg-[var(--color-bg-tertiary)]"
            title="Add subpage"
          >
            <Plus size={14} className="text-[var(--color-text-tertiary)]" />
          </button>

          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMenu(!showMenu);
              }}
              className="rounded p-1 hover:bg-[var(--color-bg-tertiary)]"
              title="More actions"
            >
              <MoreHorizontal size={14} className="text-[var(--color-text-tertiary)]" />
            </button>

            {/* Dropdown menu */}
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] py-1 shadow-lg">
                  <MenuItems onAction={handleMenuAction} />
                </div>
              </>
            )}
          </div>
        </div>
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
            <MenuItems onAction={handleMenuAction} />
          </div>
        </>
      )}

      {/* Children */}
      {isExpanded && hasChildren && (
        <div>
          {page.children!.map((child) => (
            <PageTreeItem
              key={child.id}
              page={child}
              depth={depth + 1}
              onCreateSubpage={onCreateSubpage}
              onRename={onRename}
              onDelete={onDelete}
              onDuplicate={onDuplicate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
