import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTasks, usePages } from '@/hooks';
import { useUIStore } from '@/stores';
import { formatDate, isOverdue, isToday, PRIORITY_COLORS } from '@/lib/utils';
import type { Task } from '@/types';
import { ChevronDown, ChevronRight, Calendar, Loader2 } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  pageName?: string;
  onClick: () => void;
}

function TaskItem({ task, pageName, onClick }: TaskItemProps) {
  const taskIsOverdue = task.due_date && isOverdue(task.due_date);

  return (
    <div
      onClick={onClick}
      className="flex cursor-pointer items-center gap-3 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-3 hover:shadow-sm"
    >
      {task.priority !== 'none' && (
        <span
          className="h-2 w-2 flex-shrink-0 rounded-full"
          style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
        />
      )}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-[var(--color-text-primary)]">
          {task.title || 'Untitled'}
        </div>
        {pageName && (
          <div className="truncate text-xs text-[var(--color-text-tertiary)]">
            {pageName}
          </div>
        )}
      </div>
      {task.due_date && (
        <div
          className={`flex items-center gap-1 text-xs ${
            taskIsOverdue
              ? 'text-[var(--color-danger)]'
              : 'text-[var(--color-text-tertiary)]'
          }`}
        >
          <Calendar size={12} />
          {formatDate(task.due_date)}
        </div>
      )}
    </div>
  );
}

interface TaskSectionProps {
  title: string;
  tasks: Task[];
  pages: ReturnType<typeof usePages>['pages'];
  onTaskClick: (task: Task) => void;
  defaultExpanded?: boolean;
  variant?: 'default' | 'danger';
}

function TaskSection({
  title,
  tasks,
  pages,
  onTaskClick,
  defaultExpanded = true,
  variant = 'default',
}: TaskSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  if (tasks.length === 0) return null;

  const getPageName = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    return page ? (page.icon ? `${page.icon} ${page.title}` : page.title) : 'Unknown';
  };

  return (
    <section>
      <button
        onClick={() => setExpanded(!expanded)}
        className="mb-3 flex w-full items-center gap-2 text-left"
      >
        {expanded ? (
          <ChevronDown size={16} className="text-[var(--color-text-tertiary)]" />
        ) : (
          <ChevronRight size={16} className="text-[var(--color-text-tertiary)]" />
        )}
        <h2
          className={`text-lg font-medium ${
            variant === 'danger'
              ? 'text-[var(--color-danger)]'
              : 'text-[var(--color-text-primary)]'
          }`}
        >
          {title}
        </h2>
        <span className="rounded-full bg-[var(--color-bg-tertiary)] px-2 py-0.5 text-xs text-[var(--color-text-tertiary)]">
          {tasks.length}
        </span>
      </button>

      {expanded && (
        <div className="space-y-2 pl-6">
          {tasks.map((task) => (
            <TaskItem
              key={task.id}
              task={task}
              pageName={getPageName(task.page_id)}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

export function MyTasksView() {
  const navigate = useNavigate();
  const { tasks, isLoading: tasksLoading } = useTasks({});
  const { pages, isLoading: pagesLoading } = usePages();
  const { openTaskModal } = useUIStore();

  // Categorize tasks
  const categorizedTasks = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const overdue: Task[] = [];
    const today: Task[] = [];
    const upcoming: Task[] = [];
    const noDueDate: Task[] = [];

    tasks.forEach((task) => {
      if (!task.due_date) {
        noDueDate.push(task);
        return;
      }

      const dueDate = new Date(task.due_date);

      if (isOverdue(task.due_date)) {
        overdue.push(task);
      } else if (isToday(task.due_date)) {
        today.push(task);
      } else {
        // Check if within next 7 days
        const nextWeek = new Date(now);
        nextWeek.setDate(nextWeek.getDate() + 7);
        if (dueDate <= nextWeek) {
          upcoming.push(task);
        }
      }
    });

    // Sort by due date
    const sortByDueDate = (a: Task, b: Task) => {
      if (!a.due_date) return 1;
      if (!b.due_date) return -1;
      return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
    };

    overdue.sort(sortByDueDate);
    today.sort(sortByDueDate);
    upcoming.sort(sortByDueDate);

    return { overdue, today, upcoming, noDueDate };
  }, [tasks]);

  const handleTaskClick = (task: Task) => {
    navigate(`/page/${task.page_id}`);
    setTimeout(() => {
      openTaskModal(task.id);
    }, 100);
  };

  if (tasksLoading || pagesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--color-text-tertiary)]" />
      </div>
    );
  }

  const hasAnyTasks =
    categorizedTasks.overdue.length > 0 ||
    categorizedTasks.today.length > 0 ||
    categorizedTasks.upcoming.length > 0 ||
    categorizedTasks.noDueDate.length > 0;

  return (
    <div className="flex h-full flex-col overflow-auto">
      <div className="mx-auto w-full max-w-3xl p-6">
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          My Tasks
        </h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          View all your tasks across all pages.
        </p>

        {!hasAnyTasks ? (
          <div className="mt-12 text-center">
            <div className="text-4xl">🎉</div>
            <p className="mt-4 text-[var(--color-text-secondary)]">
              You're all caught up! No tasks to show.
            </p>
            <p className="mt-2 text-sm text-[var(--color-text-tertiary)]">
              Create a page and add some tasks to get started.
            </p>
          </div>
        ) : (
          <div className="mt-8 space-y-8">
            <TaskSection
              title="Overdue"
              tasks={categorizedTasks.overdue}
              pages={pages}
              onTaskClick={handleTaskClick}
              variant="danger"
            />

            <TaskSection
              title="Today"
              tasks={categorizedTasks.today}
              pages={pages}
              onTaskClick={handleTaskClick}
            />

            <TaskSection
              title="Upcoming (Next 7 Days)"
              tasks={categorizedTasks.upcoming}
              pages={pages}
              onTaskClick={handleTaskClick}
            />

            <TaskSection
              title="No Due Date"
              tasks={categorizedTasks.noDueDate}
              pages={pages}
              onTaskClick={handleTaskClick}
              defaultExpanded={false}
            />
          </div>
        )}
      </div>
    </div>
  );
}
