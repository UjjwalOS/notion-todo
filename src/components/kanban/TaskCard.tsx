import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn, formatDate, isOverdue, PRIORITY_COLORS } from '@/lib/utils';
import type { Task } from '@/types';
import { Calendar, GripVertical } from 'lucide-react';

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
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group cursor-pointer rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] p-3 shadow-sm transition-shadow hover:shadow-md',
        showDragging && 'rotate-2 shadow-lg',
        showDragging && 'opacity-90'
      )}
      onClick={onClick}
    >
      {/* Drag handle and content */}
      <div className="flex gap-2">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 flex-shrink-0 cursor-grab rounded p-0.5 text-[var(--color-text-tertiary)] opacity-0 hover:bg-[var(--color-bg-hover)] group-hover:opacity-100 active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={14} />
        </button>

        <div className="min-w-0 flex-1">
          {/* Priority indicator */}
          {task.priority !== 'none' && (
            <div
              className="mb-1 h-1 w-8 rounded-full"
              style={{ backgroundColor: PRIORITY_COLORS[task.priority] }}
            />
          )}

          {/* Title */}
          <h4 className="text-sm font-medium text-[var(--color-text-primary)]">
            {task.title || 'Untitled'}
          </h4>

          {/* Preview text */}
          {previewText && (
            <p className="mt-1 line-clamp-2 text-xs text-[var(--color-text-secondary)]">
              {previewText}
            </p>
          )}

          {/* Image indicator */}
          {taskHasImage && (
            <div className="mt-2 h-16 rounded bg-[var(--color-bg-tertiary)]" />
          )}

          {/* Due date */}
          {task.due_date && (
            <div
              className={cn(
                'mt-2 flex items-center gap-1 text-xs',
                taskIsOverdue
                  ? 'text-[var(--color-danger)]'
                  : 'text-[var(--color-text-tertiary)]'
              )}
            >
              <Calendar size={12} />
              {formatDate(task.due_date)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
