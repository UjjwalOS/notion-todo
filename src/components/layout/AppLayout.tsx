import { useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { CommandPalette } from '@/components/modals';
import { useUIStore } from '@/stores';
import { cn } from '@/lib/utils';
import { Menu } from 'lucide-react';

export function AppLayout() {
  const { sidebarHidden, sidebarWidth, resizeSidebar, toggleSidebarHidden } = useUIStore();

  const handleSidebarResize = useCallback(
    (delta: number) => {
      resizeSidebar(delta);
    },
    [resizeSidebar]
  );

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--color-bg-primary)]">
      {/* Sidebar */}
      <div
        className={cn(
          'h-full flex-shrink-0 transition-[width] duration-200',
          sidebarHidden && 'w-0 border-r-0 overflow-hidden'
        )}
        style={{ width: sidebarHidden ? 0 : sidebarWidth }}
      >
        {!sidebarHidden && (
          <Sidebar width={sidebarWidth} onResize={handleSidebarResize} />
        )}
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
