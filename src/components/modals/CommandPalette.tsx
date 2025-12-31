import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { usePages, useTasks } from '@/hooks';
import { cn } from '@/lib/utils';
import { Search, FileText, CheckSquare, X } from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'page' | 'task';
  title: string;
  subtitle?: string;
  icon?: string;
  pageId?: string;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const { commandPaletteOpen, closeCommandPalette, openTaskModal } = useUIStore();
  const { pages } = usePages();
  const { tasks } = useTasks({});

  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Build search results
  const results = useMemo((): SearchResult[] => {
    if (!query.trim()) {
      // Show recent pages when no query
      return pages.slice(0, 5).map((page) => ({
        id: page.id,
        type: 'page',
        title: page.title || 'Untitled',
        icon: page.icon || undefined,
      }));
    }

    const lowerQuery = query.toLowerCase();
    const searchResults: SearchResult[] = [];

    // Search pages
    pages.forEach((page) => {
      if (page.title.toLowerCase().includes(lowerQuery)) {
        searchResults.push({
          id: page.id,
          type: 'page',
          title: page.title || 'Untitled',
          icon: page.icon || undefined,
        });
      }
    });

    // Search tasks
    tasks.forEach((task) => {
      if (task.title.toLowerCase().includes(lowerQuery)) {
        const parentPage = pages.find((p) => p.id === task.page_id);
        searchResults.push({
          id: task.id,
          type: 'task',
          title: task.title || 'Untitled',
          subtitle: parentPage?.title || 'Unknown page',
          pageId: task.page_id,
        });
      }
    });

    return searchResults.slice(0, 10);
  }, [query, pages, tasks]);

  // Handle selection
  const handleSelect = useCallback(
    (result: SearchResult) => {
      if (result.type === 'page') {
        navigate(`/page/${result.id}`);
      } else if (result.type === 'task' && result.pageId) {
        navigate(`/page/${result.pageId}`);
        // Small delay to ensure page loads before opening modal
        setTimeout(() => {
          openTaskModal(result.id);
        }, 100);
      }
      closeCommandPalette();
      setQuery('');
    },
    [navigate, closeCommandPalette, openTaskModal]
  );

  // Keyboard navigation
  useEffect(() => {
    if (!commandPaletteOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          closeCommandPalette();
          setQuery('');
          break;
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev < results.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) =>
            prev > 0 ? prev - 1 : results.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleSelect(results[selectedIndex]);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, results, selectedIndex, closeCommandPalette, handleSelect]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Global keyboard shortcut to open
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (commandPaletteOpen) {
          closeCommandPalette();
        } else {
          useUIStore.getState().openCommandPalette();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, closeCommandPalette]);

  if (!commandPaletteOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={() => {
          closeCommandPalette();
          setQuery('');
        }}
      />

      {/* Palette */}
      <div className="relative w-full max-w-lg overflow-hidden rounded-lg bg-[var(--color-bg-primary)] shadow-2xl">
        {/* Search input */}
        <div className="flex items-center border-b border-[var(--color-border)] px-4">
          <Search size={18} className="text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages and tasks..."
            className="flex-1 border-none bg-transparent px-3 py-4 text-sm text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
            autoFocus
          />
          <button
            onClick={() => {
              closeCommandPalette();
              setQuery('');
            }}
            className="rounded p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)]"
          >
            <X size={18} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto">
          {results.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--color-text-tertiary)]">
              {query ? 'No results found' : 'Start typing to search...'}
            </div>
          ) : (
            <div className="py-2">
              {!query && (
                <div className="px-4 py-1 text-xs font-medium text-[var(--color-text-tertiary)]">
                  Recent pages
                </div>
              )}
              {results.map((result, index) => (
                <button
                  key={`${result.type}-${result.id}`}
                  onClick={() => handleSelect(result)}
                  className={cn(
                    'flex w-full items-center gap-3 px-4 py-2 text-left',
                    index === selectedIndex
                      ? 'bg-[var(--color-bg-hover)]'
                      : 'hover:bg-[var(--color-bg-hover)]'
                  )}
                >
                  {result.type === 'page' ? (
                    result.icon ? (
                      <span className="text-base">{result.icon}</span>
                    ) : (
                      <FileText size={18} className="text-[var(--color-text-tertiary)]" />
                    )
                  ) : (
                    <CheckSquare size={18} className="text-[var(--color-text-tertiary)]" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm text-[var(--color-text-primary)]">
                      {result.title}
                    </div>
                    {result.subtitle && (
                      <div className="truncate text-xs text-[var(--color-text-tertiary)]">
                        {result.subtitle}
                      </div>
                    )}
                  </div>
                  <span className="flex-shrink-0 rounded bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 text-xs text-[var(--color-text-tertiary)]">
                    {result.type === 'page' ? 'Page' : 'Task'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--color-border)] px-4 py-2 text-xs text-[var(--color-text-tertiary)]">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded bg-[var(--color-bg-tertiary)] px-1.5 py-0.5">↑↓</kbd>{' '}
              to navigate
            </span>
            <span>
              <kbd className="rounded bg-[var(--color-bg-tertiary)] px-1.5 py-0.5">↵</kbd>{' '}
              to select
            </span>
          </div>
          <span>
            <kbd className="rounded bg-[var(--color-bg-tertiary)] px-1.5 py-0.5">Esc</kbd>{' '}
            to close
          </span>
        </div>
      </div>
    </div>
  );
}
