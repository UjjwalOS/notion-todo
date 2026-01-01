import { useState, useMemo, useCallback } from 'react';
import { useColumns, useTasks } from '@/hooks';
import { useUIStore } from '@/stores';
import { formatDate, isOverdue, PRIORITY_COLORS, PRIORITY_LABELS } from '@/lib/utils';
import type { Task } from '@/types';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui';
import { Badge } from '@/components/ui/badge';

type GroupBy = 'none' | 'status' | 'priority' | 'dueDate';
type SortBy = 'title' | 'status' | 'dueDate' | 'priority' | 'created';

interface ListViewProps {
  pageId: string;
  onTaskClick: (taskId: string) => void;
}

export function ListView({ pageId, onTaskClick }: ListViewProps) {
  const { taskDataVersion } = useUIStore();
  const { columns, isLoading: columnsLoading } = useColumns(pageId);
  const { tasks, isLoading: tasksLoading } = useTasks({ pageId, refreshKey: taskDataVersion });

  const [groupBy, setGroupBy] = useState<GroupBy>('status');
  const [sortBy, setSortBy] = useState<SortBy>('created');
  const [sortAsc, setSortAsc] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Get column name by ID - memoized for useMemo dependencies
  const getColumnName = useCallback((columnId: string) => {
    const column = columns.find((c) => c.id === columnId);
    return column?.title || 'Unknown';
  }, [columns]);

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
  }, [tasks, sortBy, sortAsc, getColumnName]);

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
  }, [sortedTasks, groupBy, getColumnName]);

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
    return <LoadingSpinner />;
  }

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-4 border-b px-4 py-2">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Group by:</span>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as GroupBy)}
            className="rounded border bg-background px-2 py-1 text-xs"
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
          <thead className="sticky top-0 bg-muted">
            <tr className="text-left text-xs text-muted-foreground">
              <th
                className="cursor-pointer px-4 py-2 font-medium hover:text-foreground"
                onClick={() => handleSort('title')}
              >
                Title {sortBy === 'title' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                className="cursor-pointer px-4 py-2 font-medium hover:text-foreground"
                onClick={() => handleSort('status')}
              >
                Status {sortBy === 'status' && (sortAsc ? '↑' : '↓')}
              </th>
              <th
                className="cursor-pointer px-4 py-2 font-medium hover:text-foreground"
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
                      className="flex w-full items-center gap-2 bg-muted/50 px-4 py-2 text-sm font-medium"
                    >
                      {collapsedGroups.has(group) ? (
                        <ChevronRight className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )}
                      {group}
                      <span className="text-xs text-muted-foreground">
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
                      className="cursor-pointer border-b hover:bg-accent/50"
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {task.priority !== 'none' && (
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                            />
                          )}
                          <span className="text-sm">
                            {task.title || 'Untitled'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="secondary">
                          {getColumnName(task.column_id)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        {task.due_date ? (
                          <span
                            className={cn(
                              'text-sm',
                              isOverdue(task.due_date)
                                ? 'text-destructive'
                                : 'text-muted-foreground'
                            )}
                          >
                            {formatDate(task.due_date)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
              </tr>
            ))}
          </tbody>
        </table>

        {tasks.length === 0 && (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No tasks yet
          </div>
        )}
      </div>
    </div>
  );
}
