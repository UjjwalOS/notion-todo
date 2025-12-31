import { useState, useMemo } from 'react';
import { useColumns, useTasks } from '@/hooks';
import { formatDate, isOverdue, PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/utils';
import type { Task } from '@/types';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight, Loader2 } from 'lucide-react';

type GroupBy = 'none' | 'status' | 'priority' | 'dueDate';
type SortBy = 'title' | 'status' | 'dueDate' | 'priority' | 'created';

interface ListViewProps {
  pageId: string;
  onTaskClick: (taskId: string) => void;
}

export function ListView({ pageId, onTaskClick }: ListViewProps) {
  const { columns, isLoading: columnsLoading } = useColumns(pageId);
  const { tasks, isLoading: tasksLoading } = useTasks({ pageId });

  const [groupBy, setGroupBy] = useState<GroupBy>('status');
  const [sortBy, setSortBy] = useState<SortBy>('created');
  const [sortAsc, setSortAsc] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Get column name by ID
  const getColumnName = (columnId: string) => {
    const column = columns.find((c) => c.id === columnId);
    return column?.title || 'Unknown';
  };

  // Sort tasks
  const sortedTasks = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'status':
          comparison = getColumnName(a.column_id).localeCompare(getColumnName(b.column_id));
          break;
        case 'dueDate':
          if (!a.due_date && !b.due_date) comparison = 0;
          else if (!a.due_date) comparison = 1;
          else if (!b.due_date) comparison = -1;
          else comparison = new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
          break;
        case 'priority': {
          const priorityOrder = { high: 0, medium: 1, low: 2, none: 3 };
          comparison = priorityOrder[a.priority] - priorityOrder[b.priority];
          break;
        }
        case 'created':
          comparison = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          break;
      }

      return sortAsc ? comparison : -comparison;
    });

    return sorted;
  }, [tasks, sortBy, sortAsc, columns]);

  // Group tasks
  const groupedTasks = useMemo(() => {
    if (groupBy === 'none') {
      return { 'All Tasks': sortedTasks };
    }

    const groups: Record<string, Task[]> = {};

    sortedTasks.forEach((task) => {
      let groupKey: string;

      switch (groupBy) {
        case 'status':
          groupKey = getColumnName(task.column_id);
          break;
        case 'priority':
          groupKey = PRIORITY_LABELS[task.priority];
          break;
        case 'dueDate':
          if (!task.due_date) {
            groupKey = 'No Due Date';
          } else if (isOverdue(task.due_date)) {
            groupKey = 'Overdue';
          } else {
            const date = new Date(task.due_date);
            const today = new Date();
            const diffDays = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays === 0) groupKey = 'Today';
            else if (diffDays === 1) groupKey = 'Tomorrow';
            else if (diffDays <= 7) groupKey = 'This Week';
            else groupKey = 'Later';
          }
          break;
        default:
          groupKey = 'All';
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(task);
    });

    return groups;
  }, [sortedTasks, groupBy, columns]);

  const toggleGroup = (group: string) => {
    setCollapsedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(group)) {
        next.delete(group);
      } else {
        next.add(group);
      }
      return next;
    });
  };

  const handleSort = (column: SortBy) => {
    if (sortBy === column) {
      setSortAsc(!sortAsc);
    } else {
      setSortBy(column);
      setSortAsc(true);
    }
  };

  if (columnsLoading || tasksLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--color-text-tertiary)]" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-4 border-b border-[var(--color-border)] px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-[var(--color-text-tertiary)]">Group by:</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-1 text-xs text-[var(--color-text-primary)]"
          >
            <option value="none">None</option>
            <option value="status">Status</option>
            <option value="priority">Priority</option>
            <option value="dueDate">Due Date</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full">
          <thead className="sticky top-0 bg-[var(--color-bg-secondary)]">
            <tr className="text-left text-xs text-[var(--color-text-tertiary)]">
              <th
                className="cursor-pointer px-4 py-2 font-medium hover:text-[var(--color-text-secondary)]"
                onClick={() => handleSort('title')}
              >
                Title {sortBy === 'title' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                className="cursor-pointer px-4 py-2 font-medium hover:text-[var(--color-text-secondary)]"
                onClick={() => handleSort('status')}
              >
                Status {sortBy === 'status' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                className="cursor-pointer px-4 py-2 font-medium hover:text-[var(--color-text-secondary)]"
                onClick={() => handleSort('dueDate')}
              >
                Due Date {sortBy === 'dueDate' && (sortAsc ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(groupedTasks).map(([group, groupTasks]) => (
              <tr key={group} className="contents">
                {/* Group header */}
                {groupBy !== 'none' && (
                  <td colSpan={3}>
                    <button
                      onClick={() => toggleGroup(group)}
                      className="flex w-full items-center gap-2 bg-[var(--color-bg-tertiary)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)]"
                    >
                      {collapsedGroups.has(group) ? (
                        <ChevronRight size={14} />
                      ) : (
                        <ChevronDown size={14} />
                      )}
                      {group}
                      <span className="text-xs text-[var(--color-text-tertiary)]">
                        ({groupTasks.length})
                      </span>
                    </button>
                  </td>
                )}
                {/* Tasks */}
                {!collapsedGroups.has(group) &&
                  groupTasks.map((task) => (
                    <tr
                      key={task.id}
                      onClick={() => onTaskClick(task.id)}
                      className="cursor-pointer border-b border-[var(--color-border)] hover:bg-[var(--color-bg-hover)]"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {task.priority !== 'none' && (
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                            />
                          )}
                          <span className="text-sm text-[var(--color-text-primary)]">
                            {task.title || 'Untitled'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="rounded bg-[var(--color-bg-tertiary)] px-2 py-1 text-xs text-[var(--color-text-secondary)]">
                          {getColumnName(task.column_id)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {task.due_date ? (
                          <span
                            className={cn(
                              'text-sm',
                              isOverdue(task.due_date)
                                ? 'text-[var(--color-danger)]'
                                : 'text-[var(--color-text-secondary)]'
                            )}
                          >
                            {formatDate(task.due_date)}
                          </span>
                        ) : (
                          <span className="text-sm text-[var(--color-text-tertiary)]">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>

        {tasks.length === 0 && (
          <div className="py-12 text-center text-sm text-[var(--color-text-tertiary)]">
            No tasks yet
          </div>
        )}
      </div>
    </div>
  );
}
