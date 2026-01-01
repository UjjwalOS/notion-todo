import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { PRIORITY_LABELS, PRIORITY_COLORS } from '@/lib/utils';
import type { Task, Priority, TaskUpdate } from '@/types';
import { Calendar, Flag, Trash2, Clock, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

interface TaskMetadataPanelProps {
  task: Task;
  onUpdate: (updates: Partial<TaskUpdate>) => void;
  onDelete: () => void;
}

export function TaskMetadataPanel({ task, onUpdate, onDelete }: TaskMetadataPanelProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);

  const handlePriorityChange = (priority: Priority) => {
    onUpdate({ priority });
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value ? new Date(e.target.value).toISOString() : null;
    onUpdate({ due_date: date });
    setDatePickerOpen(false);
  };

  const clearDueDate = () => {
    onUpdate({ due_date: null });
    setDatePickerOpen(false);
  };

  return (
    <div className="w-72 flex-shrink-0 overflow-y-auto bg-muted/50 p-4">
      <h3 className="mb-4 text-sm font-semibold">
        Details
      </h3>

      <div className="space-y-4">
        {/* Priority */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Flag className="h-3.5 w-3.5" />
            Priority
          </label>
          <div className="flex flex-wrap gap-1">
            {(['none', 'low', 'medium', 'high'] as Priority[]).map((priority) => (
              <Button
                key={priority}
                variant={task.priority === priority ? 'default' : 'secondary'}
                size="sm"
                onClick={() => handlePriorityChange(priority)}
                className="h-7 gap-1.5 px-2 text-xs"
              >
                {priority !== 'none' && (
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: PRIORITY_COLORS[priority] }}
                  />
                )}
                {PRIORITY_LABELS[priority]}
              </Button>
            ))}
          </div>
        </div>

        {/* Due Date */}
        <div>
          <label className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            Due date
          </label>
          <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className="w-full justify-start text-left font-normal"
              >
                {task.due_date ? formatDate(task.due_date) : 'No due date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-3" align="start">
              <Input
                type="date"
                value={task.due_date ? task.due_date.split('T')[0] : ''}
                onChange={handleDateChange}
                className="mb-2"
              />
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={clearDueDate}
                  className="flex-1"
                >
                  Clear
                </Button>
                <Button
                  size="sm"
                  onClick={() => setDatePickerOpen(false)}
                  className="flex-1"
                >
                  Done
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Timestamps */}
        <Separator />
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>Created: {formatDate(task.created_at)}</span>
          </div>
          {task.completed_at && (
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <CheckCircle className="h-3 w-3" />
              <span>Completed: {formatDate(task.completed_at)}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <Separator />
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          className="w-full"
        >
          <Trash2 className="h-4 w-4" />
          Move to trash
        </Button>
      </div>
    </div>
  );
}
