import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore } from '@/stores';
import { usePages } from '@/hooks';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/stores';
import { FileText, CheckSquare, Loader2 } from 'lucide-react';
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/types';

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
  const location = useLocation();
  const { commandPaletteOpen, closeCommandPalette, openTaskModal } = useUIStore();
  const { user } = useAuthStore();
  const { pages } = usePages();

  const [query, setQuery] = useState('');
  const [taskResults, setTaskResults] = useState<Task[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const pendingTaskIdRef = useRef<string | null>(null);

  // Debounced task search - only fetches when user types 2+ characters
  useEffect(() => {
    if (query.length < 2) {
      setTaskResults([]);
      return;
    }

    const searchTasks = async () => {
      if (!user) return;

      setIsSearching(true);
      try {
        const { data } = await supabase
          .from('tasks')
          .select('id, title, page_id')
          .eq('user_id', user.id)
          .eq('is_deleted', false)
          .ilike('title', `%${query}%`)
          .limit(5);

        setTaskResults((data as Task[]) || []);
      } catch {
        setTaskResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    // Debounce: wait 300ms after user stops typing
    const debounceTimer = setTimeout(searchTasks, 300);
    return () => clearTimeout(debounceTimer);
  }, [query, user]);

  // Build search results from pages (local) + tasks (fetched)
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

    // Search pages locally (already loaded)
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

    // Add task results from debounced search
    taskResults.forEach((task) => {
      const parentPage = pages.find((p) => p.id === task.page_id);
      searchResults.push({
        id: task.id,
        type: 'task',
        title: task.title || 'Untitled',
        subtitle: parentPage?.title || 'Unknown page',
        pageId: task.page_id,
      });
    });

    return searchResults.slice(0, 10);
  }, [query, pages, taskResults]);

  // Watch for navigation to complete, then open pending task modal
  useEffect(() => {
    if (pendingTaskIdRef.current) {
      const taskId = pendingTaskIdRef.current;
      pendingTaskIdRef.current = null;
      // Small delay to ensure DOM is ready after navigation
      requestAnimationFrame(() => {
        openTaskModal(taskId);
      });
    }
  }, [location.pathname, openTaskModal]);

  // Handle selection
  const handleSelect = useCallback(
    (result: SearchResult) => {
      closeCommandPalette();
      setQuery('');

      if (result.type === 'page') {
        navigate(`/page/${result.id}`);
      } else if (result.type === 'task' && result.pageId) {
        // Store the task ID to open after navigation completes
        pendingTaskIdRef.current = result.id;
        navigate(`/page/${result.pageId}`);
      }
    },
    [navigate, closeCommandPalette]
  );

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

  // Reset query when closing
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      closeCommandPalette();
      setQuery('');
    }
  };

  const pageResults = results.filter((r) => r.type === 'page');
  const taskResultsFiltered = results.filter((r) => r.type === 'task');

  return (
    <CommandDialog
      open={commandPaletteOpen}
      onOpenChange={handleOpenChange}
      title="Search"
      description="Search pages and tasks"
      showCloseButton={false}
    >
      <CommandInput
        placeholder="Search pages and tasks..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {isSearching ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Searching...</span>
            </div>
          ) : query ? (
            'No results found.'
          ) : (
            'Start typing to search...'
          )}
        </CommandEmpty>

        {pageResults.length > 0 && (
          <CommandGroup heading={query ? 'Pages' : 'Recent pages'}>
            {pageResults.map((result) => (
              <CommandItem
                key={`page-${result.id}`}
                value={`page-${result.id}-${result.title}`}
                onSelect={() => handleSelect(result)}
                className="cursor-pointer"
              >
                {result.icon ? (
                  <span className="text-base">{result.icon}</span>
                ) : (
                  <FileText className="h-4 w-4" />
                )}
                <span className="flex-1 truncate">{result.title}</span>
                <Badge variant="secondary" className="text-xs">
                  Page
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {taskResultsFiltered.length > 0 && (
          <CommandGroup heading="Tasks">
            {taskResultsFiltered.map((result) => (
              <CommandItem
                key={`task-${result.id}`}
                value={`task-${result.id}-${result.title}`}
                onSelect={() => handleSelect(result)}
                className="cursor-pointer"
              >
                <CheckSquare className="h-4 w-4" />
                <div className="flex flex-1 flex-col gap-0.5 overflow-hidden">
                  <span className="truncate">{result.title}</span>
                  {result.subtitle && (
                    <span className="truncate text-xs text-muted-foreground">
                      {result.subtitle}
                    </span>
                  )}
                </div>
                <Badge variant="secondary" className="text-xs">
                  Task
                </Badge>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>

      <div className="flex items-center justify-between border-t px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <CommandShortcut>↑↓</CommandShortcut> navigate
          </span>
          <span className="flex items-center gap-1">
            <CommandShortcut>↵</CommandShortcut> select
          </span>
        </div>
        <span className="flex items-center gap-1">
          <CommandShortcut>Esc</CommandShortcut> close
        </span>
      </div>
    </CommandDialog>
  );
}
