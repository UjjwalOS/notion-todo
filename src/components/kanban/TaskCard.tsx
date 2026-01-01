import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn, formatDate, isOverdue, PRIORITY_COLORS } from '@/lib/utils';
import type { Task } from '@/types';
import { Calendar } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface TaskCardProps {
  task: Task;
  onClick: () => void;
  isDragging?: boolean;
}

export function TaskCard({ task, onClick, isDragging = false }: TaskCardProps) {
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

  // Check if content has images
  const hasImage = (): boolean => {
    if (!task.content) return false;

    try {
      const content = task.content as { content?: Array<{ type: string }> };
      if (content.content) {
        return content.content.some((block) => block.type === 'image');
      }
    } catch {
      // Invalid content format
    }
    return false;
  };

  const previewText = getPreviewText();
  const taskHasImage = hasImage();
  const taskIsOverdue = task.due_date && isOverdue(task.due_date);

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'group cursor-grab gap-0 rounded-lg p-3 transition-all hover:shadow-md active:cursor-grabbing',
        showDragging && 'rotate-2 opacity-90 shadow-lg'
      )}
      onClick={onClick}
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

      {/* Image indicator */}
      {taskHasImage && (
        <div className="mt-2 h-16 rounded bg-muted" />
      )}

      {/* Due date */}
      {task.due_date && (
        <div
          className={cn(
            'mt-2 flex items-center gap-1 text-xs',
            taskIsOverdue
              ? 'text-destructive'
              : 'text-muted-foreground'
          )}
        >
          <Calendar className="h-3 w-3" />
          {formatDate(task.due_date)}
        </div>
      )}
    </Card>
  );
}
