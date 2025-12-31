import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { CommandPalette } from '@/components/modals';
import { useUIStore } from '@/stores';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';

export function AppLayout() {
  const { sidebarHidden, toggleSidebarHidden } = useUIStore();

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg-primary)]">
      {/* Sidebar */}
      <div
        className={cn(
          'h-full flex-shrink-0 transition-all duration-200',
          sidebarHidden ? 'w-0' : 'w-60'
        )}
      >
        {!sidebarHidden && <Sidebar />}
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar when sidebar is hidden */}
        {sidebarHidden && (
          <div className="flex h-12 flex-shrink-0 items-center border-b border-[var(--color-border)] px-4">
            <button
              onClick={toggleSidebarHidden}
              className="rounded p-1.5 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-primary)]"
              title="Show sidebar"
            >
              <Menu size={18} />
            </button>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      {/* Command Palette */}
      <CommandPalette />
    </div>
  );
}
