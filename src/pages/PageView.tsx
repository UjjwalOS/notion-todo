import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePages } from '@/hooks';
import { useUIStore } from '@/stores';
import { KanbanBoard, ListView } from '@/components/kanban';
import { TaskModal } from '@/components/modals';
import { cn } from '@/lib/utils';
import { LayoutGrid, List, ChevronRight } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui';

type ViewMode = 'kanban' | 'list';

export function PageView() {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const { pages, isLoading } = usePages();
  const { openTaskModal } = useUIStore();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');

  const page = pages.find((p) => p.id === pageId);

  // Build breadcrumb path
  const getBreadcrumb = () => {
    if (!page) return [];

    const breadcrumb: typeof pages = [];
    let current = page;

    while (current) {
      breadcrumb.unshift(current);
      if (current.parent_id) {
        const parent = pages.find((p) => p.id === current.parent_id);
        if (parent) {
          current = parent;
        } else {
          break;
        }
      } else {
        break;
      }
    }

    return breadcrumb;
  };

  const breadcrumb = getBreadcrumb();

  // Handle task click
  const handleTaskClick = (taskId: string) => {
    openTaskModal(taskId);
  };

  // Redirect if page not found after loading
  useEffect(() => {
    if (!isLoading && pageId && !page) {
      navigate('/');
    }
  }, [isLoading, pageId, page, navigate]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!page || !pageId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-[var(--color-text-tertiary)]">Page not found</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-[var(--color-border)] px-4 py-3">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1 text-sm">
          {breadcrumb.length > 3 ? (
            <>
              <button
                onClick={() => navigate(`/page/${breadcrumb[0].id}`)}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                {breadcrumb[0].icon || '📄'} {breadcrumb[0].title}
              </button>
              <ChevronRight size={14} className="text-[var(--color-text-tertiary)]" />
              <span className="text-[var(--color-text-tertiary)]">...</span>
              <ChevronRight size={14} className="text-[var(--color-text-tertiary)]" />
              <span className="text-[var(--color-text-primary)]">
                {page.icon || '📄'} {page.title}
              </span>
            </>
          ) : (
            breadcrumb.map((item, index) => (
              <div key={item.id} className="flex items-center gap-1">
                {index > 0 && (
                  <ChevronRight size={14} className="text-[var(--color-text-tertiary)]" />
                )}
                {index === breadcrumb.length - 1 ? (
                  <span className="text-[var(--color-text-primary)]">
                    {item.icon || '📄'} {item.title}
                  </span>
                ) : (
                  <button
                    onClick={() => navigate(`/page/${item.id}`)}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  >
                    {item.icon || '📄'} {item.title}
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-md border border-[var(--color-border)] p-0.5">
          <button
            onClick={() => setViewMode('kanban')}
            className={cn(
              'rounded p-1.5 transition-colors',
              viewMode === 'kanban'
                ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
            )}
            title="Kanban view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn(
              'rounded p-1.5 transition-colors',
              viewMode === 'list'
                ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]'
                : 'text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]'
            )}
            title="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'kanban' ? (
          <KanbanBoard pageId={pageId} onTaskClick={handleTaskClick} />
        ) : (
          <ListView pageId={pageId} onTaskClick={handleTaskClick} />
        )}
      </div>

      {/* Task Modal */}
      <TaskModal pageId={pageId} />
    </div>
  );
}
