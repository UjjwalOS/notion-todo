import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/utils';
import type { Task, Priority, TaskUpdate } from '@/types';
import { Calendar, Flag, Trash2, Clock, CheckCircle } from 'lucide-react';

interface TaskMetadataPanelProps {
  task: Task;
  onUpdate: (updates: Partial<TaskUpdate>) => void;
  onDelete: () => void;
}

export function TaskMetadataPanel({ task, onUpdate, onDelete }: TaskMetadataPanelProps) {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handlePriorityChange = (priority: Priority) => {
    onUpdate({ priority });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value).toISOString() : null;
    onUpdate({ due_date: date });
    setShowDatePicker(false);
  };

  const clearDueDate = () => {
    onUpdate({ due_date: null });
    setShowDatePicker(false);
  };

  return (
    <div className="w-72 flex-shrink-0 overflow-y-auto bg-[var(--color-bg-secondary)] p-4">
      <h3 className="mb-4 text-sm font-semibold text-[var(--color-text-primary)]">
        Details
      </h3>

      <div className="space-y-4">
        {/* Priority */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)]">
            <Flag size={14} />
            Priority
          </label>
          <div className="flex flex-wrap gap-1">
            {(['none', 'low', 'medium', 'high'] as Priority[]).map((priority) => (
              <button
                key={priority}
                onClick={() => handlePriorityChange(priority)}
                className={`rounded px-2 py-1 text-xs transition-colors ${
                  task.priority === priority
                    ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)] ring-1 ring-[var(--color-accent)]'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                {priority !== 'none' && (
                  <span
                    className="mr-1 inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: PRIORITY_COLORS[priority] }}
                  />
                )}
                {PRIORITY_LABELS[priority]}
              </button>
            ))}
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-xs font-medium text-[var(--color-text-secondary)]">
            <Calendar size={14} />
            Due date
          </label>
          <div className="relative">
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="w-full rounded bg-[var(--color-bg-tertiary)] px-3 py-2 text-left text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
            >
              {task.due_date ? formatDate(task.due_date) : 'No due date'}
            </button>

            {showDatePicker && (
              <div className="absolute top-full z-10 mt-1 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-2 shadow-lg">
                <input
                  type="date"
                  value={task.due_date ? task.due_date.split('T')[0] : ''}
                  onChange={handleDateChange}
                  className="mb-2 w-full rounded border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-2 py-1 text-sm"
                />
                <div className="flex gap-2">
                  <button
                    onClick={clearDueDate}
                    className="flex-1 rounded bg-[var(--color-bg-tertiary)] px-2 py-1 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowDatePicker(false)}
                    className="flex-1 rounded bg-[var(--color-accent)] px-2 py-1 text-xs text-white hover:bg-[var(--color-accent-hover)]"
                  >
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Timestamps */}
        <div className="border-t border-[var(--color-border)] pt-4">
          <div className="space-y-2 text-xs text-[var(--color-text-tertiary)]">
            <div className="flex items-center gap-2">
              <Clock size={12} />
              <span>Created: {formatDate(task.created_at)}</span>
            </div>
            {task.completed_at && (
              <div className="flex items-center gap-2 text-[var(--color-success)]">
                <CheckCircle size={12} />
                <span>Completed: {formatDate(task.completed_at)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-[var(--color-border)] pt-4">
          <button
            onClick={onDelete}
            className="flex w-full items-center justify-center gap-2 rounded bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)] hover:bg-[var(--color-danger)]/20"
          >
            <Trash2 size={14} />
            Move to trash
          </button>
        </div>
      </div>
    </div>
  );
}
