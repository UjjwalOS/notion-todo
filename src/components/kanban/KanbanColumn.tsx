import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useDroppable } from '@dnd-kit/core';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';
import type { Column, Task, ColumnUpdate } from '@/types';
import { Plus, MoreHorizontal, GripVertical, Pencil, Trash2, Palette } from 'lucide-react';
import { COLUMN_COLORS } from '@/lib/utils';

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  onCreateTask: () => void;
  onUpdateTitle: (title: string) => void;
  onDelete: () => void;
  onTaskClick: (taskId: string) => void;
  onUpdateColumn: (data: ColumnUpdate) => void;
}

export function KanbanColumn({
  column,
  tasks,
  onCreateTask,
  onUpdateTitle,
  onDelete,
  onTaskClick,
  onUpdateColumn,
}: KanbanColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(column.title);
  const [showMenu, setShowMenu] = useState(false);
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
    setShowMenu(false);
  };

  return (
    <div
      ref={setSortableRef}
      style={style}
      className={cn(
        'flex h-full w-72 flex-shrink-0 flex-col rounded-lg bg-[var(--color-bg-secondary)]',
        isDragging && 'opacity-50'
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
          className="cursor-grab rounded p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-secondary)] active:cursor-grabbing"
        >
          <GripVertical size={14} />
        </button>

        {/* Icon */}
        {column.icon && <span className="text-sm">{column.icon}</span>}

        {/* Title */}
        {isEditing ? (
          <input
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
            className="flex-1 rounded bg-transparent px-1 text-sm font-medium text-[var(--color-text-primary)] outline-none ring-1 ring-[var(--color-accent)]"
            autoFocus
          />
        ) : (
          <span
            className="flex-1 cursor-pointer text-sm font-medium text-[var(--color-text-primary)]"
            onClick={() => setIsEditing(true)}
          >
            {column.title}
          </span>
        )}

        {/* Task count */}
        <span className="rounded bg-[var(--color-bg-tertiary)] px-1.5 py-0.5 text-xs text-[var(--color-text-tertiary)]">
          {tasks.length}
        </span>

        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="rounded p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-secondary)]"
          >
            <MoreHorizontal size={14} />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] py-1 shadow-lg">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
                >
                  <Pencil size={14} />
                  Rename
                </button>
                <button
                  onClick={() => setShowColorPicker(!showColorPicker)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
                >
                  <Palette size={14} />
                  Change color
                </button>
                {showColorPicker && (
                  <div className="flex flex-wrap gap-1 px-3 py-2">
                    {COLUMN_COLORS.map((color) => (
                      <button
                        key={color}
                        onClick={() => handleColorChange(color)}
                        className={cn(
                          'h-5 w-5 rounded border-2',
                          color === column.color
                            ? 'border-[var(--color-accent)]'
                            : 'border-transparent'
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                )}
                <div className="my-1 border-t border-[var(--color-border)]" />
                <button
                  onClick={() => {
                    onDelete();
                    setShowMenu(false);
                  }}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-sm text-[var(--color-danger)] hover:bg-[var(--color-bg-hover)]"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>

        {/* Add task button */}
        <button
          onClick={onCreateTask}
          className="rounded p-1 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-secondary)]"
          title="Add task"
        >
          <Plus size={14} />
        </button>
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
            <div className="py-8 text-center text-sm text-[var(--color-text-tertiary)]">
              No tasks
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick(task.id)}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
