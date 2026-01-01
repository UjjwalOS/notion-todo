import { useState } from 'react';
import { formatDate, getDueDateStatus, DUE_DATE_COLORS } from '@/lib/utils';
import { PRIORITY_COLORS } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Task, Priority, TaskUpdate } from '@/types';
import { useAssigneeStore } from '@/stores';
import { Calendar as CalendarIcon, CalendarX, CalendarClock, Flag, Trash2, MoreHorizontal, X, ChevronDown, User, Plus, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface TaskMetadataPanelProps {
  task: Task;
  onUpdate: (updates: Partial<TaskUpdate>) => void;
  onDelete: () => void;
}

// Priority configuration with semantic colors - Using Untitled UI color system
const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  none: { label: 'No priority', color: 'text-muted-foreground' },
  low: { label: 'Low', color: 'text-[var(--success-600)] dark:text-[var(--success-500)]' },
  medium: { label: 'Medium', color: 'text-[var(--warning-600)] dark:text-[var(--warning-500)]' },
  high: { label: 'High', color: 'text-[var(--error-600)] dark:text-[var(--error-500)]' },
};

export function TaskMetadataPanel({ task, onUpdate, onDelete }: TaskMetadataPanelProps) {
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [priorityOpen, setPriorityOpen] = useState(false);
  const [assigneeOpen, setAssigneeOpen] = useState(false);
  const [newAssigneeName, setNewAssigneeName] = useState('');

  const { assignees, addAssignee, getAssigneeByName } = useAssigneeStore();

  // Get current assignee info
  const currentAssignee = task.assignee ? getAssigneeByName(task.assignee) : null;

  const handlePriorityChange = (priority: Priority) => {
    onUpdate({ priority });
    setPriorityOpen(false);
  };

  const handleAssigneeSelect = (name: string | null) => {
    onUpdate({ assignee: name });
    setAssigneeOpen(false);
  };

  const handleCreateAssignee = () => {
    if (newAssigneeName.trim()) {
      const assignee = addAssignee(newAssigneeName.trim());
      onUpdate({ assignee: assignee.name });
      setNewAssigneeName('');
      setAssigneeOpen(false);
    }
  };

  const clearAssignee = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ assignee: null });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      onUpdate({ due_date: date.toISOString() });
    }
    setDatePickerOpen(false);
  };

  const clearDueDate = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate({ due_date: null });
  };

  const priorityConfig = PRIORITY_CONFIG[task.priority];

  return (
    <div className="flex h-full w-72 flex-shrink-0 flex-col bg-muted/30">
      {/* Header - aligned with main modal header (same py-3 padding) */}
      <div className="flex flex-shrink-0 items-center justify-between border-b px-4 py-3">
        <span className="text-sm font-medium">Details</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete task
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Properties section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          {/* Property rows container */}
          <div className="space-y-1">
            {/* Priority Row */}
            <Popover open={priorityOpen} onOpenChange={setPriorityOpen}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors',
                    'hover:bg-accent/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                  )}
                >
                  <Flag className="h-4 w-4 flex-shrink-0 text-muted-foreground/70" />
                  <span className="w-14 flex-shrink-0 text-left text-muted-foreground">Priority</span>
                  <div className="flex flex-1 items-center justify-between">
                    <div className={cn('flex items-center gap-1.5', priorityConfig.color)}>
                      {task.priority !== 'none' && (
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
                        />
                      )}
                      <span className="text-sm">{priorityConfig.label}</span>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-48 p-1" align="start" sideOffset={4}>
                <div className="space-y-0.5">
                  {(['none', 'low', 'medium', 'high'] as Priority[]).map((priority) => {
                    const config = PRIORITY_CONFIG[priority];
                    const isSelected = task.priority === priority;
                    return (
                      <button
                        key={priority}
                        onClick={() => handlePriorityChange(priority)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                          'hover:bg-accent focus:outline-none',
                          isSelected && 'bg-accent'
                        )}
                      >
                        {priority !== 'none' ? (
                          <span
                            className="h-2.5 w-2.5 rounded-full"
                            style={{ backgroundColor: PRIORITY_COLORS[priority] }}
                          />
                        ) : (
                          <span className="h-2.5 w-2.5 rounded-full border border-dashed border-muted-foreground/40" />
                        )}
                        <span className={config.color}>{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>

            {/* Due Date Row */}
            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                {(() => {
                  const dueDateStatus = task.due_date ? getDueDateStatus(task.due_date) : null;
                  const dueDateColors = dueDateStatus ? DUE_DATE_COLORS[dueDateStatus] : null;

                  // Choose icon based on due date status
                  const DueDateIcon = dueDateStatus === 'overdue'
                    ? CalendarX
                    : (dueDateStatus === 'due-today' || dueDateStatus === 'due-soon')
                    ? CalendarClock
                    : CalendarIcon;

                  return (
                    <button
                      className={cn(
                        'group flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors',
                        'hover:bg-accent/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                      )}
                    >
                      <DueDateIcon className={cn(
                        "h-4 w-4 flex-shrink-0",
                        dueDateColors?.icon || "text-muted-foreground/70"
                      )} />
                      <span className="w-14 flex-shrink-0 text-left text-muted-foreground">Due</span>
                      <div className="flex flex-1 items-center justify-between">
                        {task.due_date ? (
                          <div className="flex items-center gap-1">
                            <span className={cn("text-sm", dueDateColors?.text || "text-foreground")}>
                              {formatDate(task.due_date)}
                            </span>
                            <button
                              onClick={clearDueDate}
                              className="ml-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                            >
                              <X className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-muted-foreground/60">Empty</span>
                        )}
                        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                    </button>
                  );
                })()}
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start" sideOffset={4}>
                <Calendar
                  mode="single"
                  selected={task.due_date ? new Date(task.due_date) : undefined}
                  onSelect={handleDateSelect}
                  initialFocus
                />
                {task.due_date && (
                  <div className="border-t p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        onUpdate({ due_date: null });
                        setDatePickerOpen(false);
                      }}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Clear date
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>

            {/* Assignee Row */}
            <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
              <PopoverTrigger asChild>
                <button
                  className={cn(
                    'group flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm transition-colors',
                    'hover:bg-accent/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring'
                  )}
                >
                  <User className="h-4 w-4 flex-shrink-0 text-muted-foreground/70" />
                  <span className="w-14 flex-shrink-0 text-left text-muted-foreground">Assign</span>
                  <div className="flex flex-1 items-center justify-between">
                    {task.assignee ? (
                      <div className="flex items-center gap-1.5">
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-[var(--color-on-accent)]"
                          style={{ backgroundColor: currentAssignee?.color || '#6b7280' }}
                        >
                          {task.assignee.charAt(0).toUpperCase()}
                        </span>
                        <span className="text-sm text-foreground">{task.assignee}</span>
                        <button
                          onClick={clearAssignee}
                          className="ml-1 rounded p-0.5 opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100"
                        >
                          <X className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-sm text-muted-foreground/60">Empty</span>
                    )}
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-1" align="start" sideOffset={4}>
                {/* Existing assignees */}
                <div className="space-y-0.5">
                  {/* Unassigned option */}
                  <button
                    onClick={() => handleAssigneeSelect(null)}
                    className={cn(
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                      'hover:bg-accent focus:outline-none',
                      !task.assignee && 'bg-accent'
                    )}
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full border border-dashed border-muted-foreground/40">
                      <User className="h-3 w-3 text-muted-foreground/40" />
                    </span>
                    <span className="text-muted-foreground">Unassigned</span>
                    {!task.assignee && <Check className="ml-auto h-4 w-4 text-primary" />}
                  </button>

                  {/* Existing assignees list */}
                  {assignees.map((assignee) => {
                    const isSelected = task.assignee === assignee.name;
                    return (
                      <button
                        key={assignee.id}
                        onClick={() => handleAssigneeSelect(assignee.name)}
                        className={cn(
                          'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors',
                          'hover:bg-accent focus:outline-none',
                          isSelected && 'bg-accent'
                        )}
                      >
                        <span
                          className="flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-medium text-[var(--color-on-accent)]"
                          style={{ backgroundColor: assignee.color }}
                        >
                          {assignee.name.charAt(0).toUpperCase()}
                        </span>
                        <span>{assignee.name}</span>
                        {isSelected && <Check className="ml-auto h-4 w-4 text-primary" />}
                      </button>
                    );
                  })}
                </div>

                {/* Divider */}
                <div className="my-1 border-t" />

                {/* Create new assignee */}
                <div className="p-1">
                  <div className="flex gap-1">
                    <Input
                      placeholder="Add new person..."
                      value={newAssigneeName}
                      onChange={(e) => setNewAssigneeName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleCreateAssignee();
                        }
                      }}
                      className="h-8 text-sm"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 px-2"
                      onClick={handleCreateAssignee}
                      disabled={!newAssigneeName.trim()}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Footer - subtle metadata */}
      <div className="border-t border-border/50 px-4 py-3">
        <span className="text-xs text-muted-foreground/60">
          Created {formatDate(task.created_at)}
        </span>
      </div>
    </div>
  );
}
