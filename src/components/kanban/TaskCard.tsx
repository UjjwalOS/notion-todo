import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn, formatDate, getDueDateStatus, DUE_DATE_COLORS, PRIORITY_COLORS } from '@/lib/utils';
import { useSelectionStore } from '@/stores';
import type { Task } from '@/types';
import { Calendar, CalendarX, CalendarClock } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onClick, isDragging = false }: TaskCardProps) {
  const { selectedTaskIds, selectTask, toggleTaskSelection, openContextMenu } = useSelectionStore();
  const isSelected = selectedTaskIds.has(task.id);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: task.id,
    data: {
      type: 'task',
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const showDragging = isDragging || isSortableDragging;

  // Handle click with modifier keys for multi-select
  const handleClick = (e: React.MouseEvent) => {
    if (e.ctrlKey || e.metaKey) {
      // Ctrl/Cmd + click: toggle selection
      e.stopPropagation();
      toggleTaskSelection(task.id);
    } else if (e.shiftKey) {
      // Shift + click: add to selection
      e.stopPropagation();
      selectTask(task.id, true);
    } else {
      // Normal click: open task (let parent handle)
      onClick();
    }
  };

  // Handle right-click for context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    openContextMenu(e.clientX, e.clientY, task.id);
  };

  // Extract preview text from content
  const getPreviewText = (): string | null => {
    if (!task.content) return null;

    try {
      const content = task.content as { content?: Array<{ type: string; content?: Array<{ text?: string }> }> };
      if (content.content) {
        for (const block of content.content) {
          if (block.type === 'paragraph' && block.content) {
            for (const item of block.content) {
              if (item.text) {
                return item.text.slice(0, 100);
              }
            }
          }
        }
      }
    } catch {
      // Invalid content format
    }
    return null;
  };

  // Extract first image URL from content
  const getFirstImageUrl = (): string | null => {
    if (!task.content) return null;

    try {
      const content = task.content as { content?: Array<{ type: string; attrs?: { src?: string } }> };
      if (content.content) {
        for (const block of content.content) {
          if (block.type === 'image' && block.attrs?.src) {
            return block.attrs.src;
          }
        }
      }
    } catch {
      // Invalid content format
    }
    return null;
  };

  const previewText = getPreviewText();
  const firstImageUrl = getFirstImageUrl();

  // Get due date status and colors
  const dueDateStatus = task.due_date ? getDueDateStatus(task.due_date) : null;
  const dueDateColors = dueDateStatus ? DUE_DATE_COLORS[dueDateStatus] : null;

  // Choose icon based on due date status
  const DueDateIcon = dueDateStatus === 'overdue'
    ? CalendarX
    : (dueDateStatus === 'due-today' || dueDateStatus === 'due-soon')
    ? CalendarClock
    : Calendar;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group relative cursor-grab gap-0 rounded-lg p-3 transition-all hover:shadow-md active:cursor-grabbing',
        showDragging && 'rotate-2 opacity-90 shadow-lg',
        isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
      )}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
    >
      {/* Priority indicator */}
      {task.priority !== 'none' && (
        <div
          className="mb-1.5 h-1 w-8 rounded-full"
          style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
        />
      )}

      {/* Title */}
      <h4 className="text-sm font-medium">
        {task.title || 'Untitled'}
      </h4>

      {/* Preview text */}
      {previewText && (
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
          {previewText}
        </p>
      )}

      {/* Image thumbnail */}
      {firstImageUrl && (
        <div className="mt-2 overflow-hidden rounded">
          <img
            src={firstImageUrl}
            alt=""
            className="h-24 w-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Due date */}
      {task.due_date && (
        <div
          className={cn(
            'mt-2 flex items-center gap-1 text-xs',
            dueDateColors?.text || 'text-muted-foreground'
          )}
        >
          <DueDateIcon className={cn('h-3 w-3', dueDateColors?.icon)} />
          {formatDate(task.due_date)}
        </div>
      )}
    </Card>
  );
}
