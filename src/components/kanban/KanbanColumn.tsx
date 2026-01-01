import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';
import type { Column, Task, ColumnUpdate } from '@/types';
import type { DropIndicator } from './KanbanBoard';
import { Plus, MoreHorizontal, GripVertical, Pencil, Trash2, Palette } from 'lucide-react';
import { COLUMN_COLORS } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Drop indicator line component
function DropIndicatorLine() {
  return (
    <div className="drop-indicator mx-1 my-1 h-1 rounded-full bg-primary" />
  );
}

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onCreateTask: () => void;
  onUpdateTitle: (title: string) => void;
  onDelete: () => void;
  onTaskClick: (taskId: string) => void;
  onUpdateColumn: (data: ColumnUpdate) => void;
  dropIndicator: DropIndicator | null;
  isDragActive: boolean;
}

export function KanbanColumn({
  column,
  tasks,
  onCreateTask,
  onUpdateTitle,
  onDelete,
  onTaskClick,
  onUpdateColumn,
  dropIndicator,
  isDragActive,
}: KanbanColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  const { setNodeRef: setDroppableRef } = useDroppable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const handleTitleSubmit = () => {
    if (editTitle.trim() && editTitle !== column.title) {
      onUpdateTitle(editTitle.trim());
    } else {
      setEditTitle(column.title);
    }
    setIsEditing(false);
  };

  const handleColorChange = (color: string) => {
    onUpdateColumn({ id: column.id, color });
    setShowColorPicker(false);
  };

  // Check if this column is the current drop target
  const isDropTarget = dropIndicator !== null;

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={cn(
        'flex h-full w-72 flex-shrink-0 flex-col rounded-lg bg-muted/50 transition-colors duration-200',
        isDragging && 'opacity-50',
        isDragActive && isDropTarget && 'ring-2 ring-primary/50 bg-primary/5'
      )}
    >
      {/* Column Header */}
      <div
        className="flex items-center gap-2 px-3 py-2"
        style={{ borderTop: `3px solid ${column.color}` }}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground active:cursor-grabbing"
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>

        {/* Icon */}
        {column.icon && <span className="text-sm">{column.icon}</span>}

        {/* Title */}
        {isEditing ? (
          <Input
            type="text"
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            onBlur={handleTitleSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleTitleSubmit();
              if (e.key === 'Escape') {
                setEditTitle(column.title);
                setIsEditing(false);
              }
            }}
            className="h-7 flex-1 px-2 text-sm font-medium"
            autoFocus
          />
        ) : (
          <span
            className="flex-1 cursor-pointer text-sm font-medium"
            onClick={() => setIsEditing(true)}
          >
            {column.title}
          </span>
        )}

        {/* Task count */}
        <Badge variant="secondary" className="text-xs">
          {tasks.length}
        </Badge>

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-sm" className="h-7 w-7">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setIsEditing(true)}>
              <Pencil className="h-4 w-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setShowColorPicker(!showColorPicker)}>
              <Palette className="h-4 w-4" />
              Change color
            </DropdownMenuItem>
            {showColorPicker && (
              <div className="flex flex-wrap gap-1 px-2 py-2">
                {COLUMN_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => handleColorChange(color)}
                    className={cn(
                      'h-5 w-5 rounded border-2',
                      color === column.color
                        ? 'border-primary'
                        : 'border-transparent'
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onDelete}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Add task button */}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onCreateTask}
          className="h-7 w-7"
          title="Add task"
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Task list */}
      <div
        ref={setDroppableRef}
        className="flex-1 overflow-y-auto px-2 pb-2"
      >
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          {tasks.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {isDropTarget ? <DropIndicatorLine /> : 'No tasks'}
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task, index) => (
                <div key={task.id}>
                  {/* Show drop indicator before this task */}
                  {dropIndicator?.index === index && <DropIndicatorLine />}
                  <TaskCard
                    task={task}
                    onClick={() => onTaskClick(task.id)}
                  />
                </div>
              ))}
              {/* Show drop indicator at the end if dropping after last task */}
              {dropIndicator?.index === tasks.length && <DropIndicatorLine />}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
