import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore, useThemeStore } from '@/stores';
import { PageTree } from './PageTree';
import {
  Search,
  ChevronLeft,
  CheckSquare,
  Trash2,
  Settings,
  Sun,
  Moon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  width: number;
  onResize: (delta: number) => void;
}

function ResizeHandle({ onResize }: { onResize: (delta: number) => void }) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    let lastX = e.clientX;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - lastX;
      lastX = moveEvent.clientX;
      onResize(delta);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-[var(--color-border)] active:bg-[var(--color-text-tertiary)] transition-colors z-10"
      title="Drag to resize"
    />
  );
}

// Compact sidebar item component - inspired by Notion/Linear
interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  isActive?: boolean;
  shortcut?: string;
  className?: string;
}

function SidebarItem({ icon, label, onClick, isActive, shortcut, className }: SidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2 rounded-md px-2 py-1 text-sm transition-colors',
        isActive
          ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]',
        className
      )}
    >
      {icon}
      <span className="flex-1 text-left">{label}</span>
      {shortcut && (
        <kbd className="rounded bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-text-tertiary)]">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}

export function Sidebar({ width, onResize }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleSidebarHidden, openCommandPalette } = useUIStore();
  const { theme, toggleTheme } = useThemeStore();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="relative flex h-full flex-col bg-sidebar border-r border-[var(--color-border)]" style={{ width }}>
      {/* Header */}
      <div className="flex h-11 flex-shrink-0 items-center justify-between pl-3 pr-1">
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
          Notion Todo
        </span>
        <div className="flex items-center">
          <button
            onClick={toggleTheme}
            className="rounded p-1.5 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-secondary)]"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={toggleSidebarHidden}
            className="rounded p-1.5 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-secondary)]"
            title="Hide sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {/* Search & Quick Links */}
      <div className="px-2 space-y-0.5">
        <SidebarItem
          icon={<Search size={16} />}
          label="Search"
          onClick={openCommandPalette}
          shortcut="Ctrl K"
        />
        <SidebarItem
          icon={<CheckSquare size={16} />}
          label="My Tasks"
          onClick={() => navigate('/my-tasks')}
          isActive={isActive('/my-tasks') || isActive('/')}
        />
      </div>

      {/* Divider */}
      <div className="my-2 mx-2 border-t border-[var(--color-border)]" />

      {/* Pages Section */}
      <div className="flex-1 overflow-auto">
        <div className="mb-1 px-3">
          <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--color-text-tertiary)]">
            Pages
          </span>
        </div>
        <div className="px-2">
          <PageTree />
        </div>
      </div>

      {/* Bottom Links */}
      <div className="my-2 mx-2 border-t border-[var(--color-border)]" />
      <div className="flex-shrink-0 px-2 pb-2 space-y-0.5">
        <SidebarItem
          icon={<Trash2 size={16} />}
          label="Trash"
          onClick={() => navigate('/trash')}
          isActive={isActive('/trash')}
        />
        <SidebarItem
          icon={<Settings size={16} />}
          label="Settings"
          onClick={() => navigate('/settings')}
          isActive={isActive('/settings')}
        />
      </div>

      {/* Resize Handle */}
      <ResizeHandle onResize={onResize} />
    </div>
  );
}
