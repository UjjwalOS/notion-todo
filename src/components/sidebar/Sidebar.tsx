import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore, useThemeStore } from '@/stores';
import { cn } from '@/lib/utils';
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

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { toggleSidebarHidden, openCommandPalette } = useUIStore();
  const { theme, toggleTheme } = useThemeStore();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="flex h-full flex-col border-r border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
      {/* Header */}
      <div className="flex h-12 flex-shrink-0 items-center justify-between px-3">
        <span className="text-sm font-semibold text-[var(--color-text-primary)]">
          Notion Todo
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={toggleTheme}
            className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={toggleSidebarHidden}
            className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
            title="Hide sidebar"
          >
            <ChevronLeft size={16} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-2 pb-2">
        <button
          onClick={openCommandPalette}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
        >
          <Search size={16} />
          <span>Search</span>
          <kbd className="ml-auto rounded bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 text-xs text-[var(--color-text-tertiary)]">
            Ctrl K
          </kbd>
        </button>
      </div>

      {/* Quick Links */}
      <div className="px-2 pb-2">
        <button
          onClick={() => navigate('/my-tasks')}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm',
            isActive('/my-tasks') || isActive('/')
              ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
          )}
        >
          <CheckSquare size={16} />
          <span>My Tasks</span>
        </button>
      </div>

      {/* Divider */}
      <div className="mx-2 border-t border-[var(--color-border)]" />

      {/* Pages Section */}
      <div className="flex-1 overflow-auto px-2 py-2">
        <div className="mb-2 px-2">
          <span className="text-xs font-medium uppercase text-[var(--color-text-tertiary)]">
            Pages
          </span>
        </div>
        <PageTree />
      </div>

      {/* Bottom Links */}
      <div className="flex-shrink-0 border-t border-[var(--color-border)] px-2 py-2">
        <button
          onClick={() => navigate('/trash')}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm',
            isActive('/trash')
              ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
          )}
        >
          <Trash2 size={16} />
          <span>Trash</span>
        </button>
        <button
          onClick={() => navigate('/settings')}
          className={cn(
            'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm',
            isActive('/settings')
              ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]'
              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
          )}
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
      </div>
    </div>
  );
}
