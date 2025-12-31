import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useColumns, useTasks } from '@/hooks';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { AddColumnButton } from './AddColumnButton';
import type { Task, Column } from '@/types';
import { Plus, Loader2 } from 'lucide-react';

interface KanbanBoardProps {
  pageId: string;
  onTaskClick: (taskId: string) => void;
}

export function KanbanBoard({ pageId, onTaskClick }: KanbanBoardProps) {
  const {
    columns,
    isLoading: columnsLoading,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    createDefaultColumns,
  } = useColumns(pageId);

  const {
    tasksByColumn,
    isLoading: tasksLoading,
    createTask,
    deleteTask,
    moveTask,
  } = useTasks({ pageId });

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [_activeColumn, setActiveColumn] = useState<Column | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === 'task') {
      setActiveTask(activeData.task);
    } else if (activeData?.type === 'column') {
      setActiveColumn(activeData.column);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type !== 'task') return;

    const activeColumnId = activeData.task.column_id;
    const overColumnId = overData?.type === 'column'
      ? overData.column.id
      : overData?.task?.column_id;

    if (!overColumnId || activeColumnId === overColumnId) return;

    // Move task to new column preview (handled in DragEnd for actual update)
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveTask(null);
      setActiveColumn(null);

      if (!over) return;

      const activeData = active.data.current;
      const overData = over.data.current;

      // Handle column reordering
      if (activeData?.type === 'column' && overData?.type === 'column') {
        const activeIndex = columns.findIndex((c) => c.id === active.id);
        const overIndex = columns.findIndex((c) => c.id === over.id);

        if (activeIndex !== overIndex) {
          await reorderColumns(active.id as string, overIndex);
        }
        return;
      }

      // Handle task movement
      if (activeData?.type === 'task') {
        const activeTask = activeData.task;
        let targetColumnId: string;
        let targetPosition: number;

        if (overData?.type === 'task') {
          targetColumnId = overData.task.column_id;
          const columnTasks = tasksByColumn[targetColumnId] || [];
          targetPosition = columnTasks.findIndex((t) => t.id === over.id);
        } else if (overData?.type === 'column') {
          targetColumnId = overData.column.id;
          targetPosition = 0; // Drop at top of empty column
        } else {
          return;
        }

        if (
          activeTask.column_id !== targetColumnId ||
          activeTask.position !== targetPosition
        ) {
          await moveTask(activeTask.id, targetColumnId, targetPosition);
        }
      }
    },
    [columns, tasksByColumn, reorderColumns, moveTask]
  );

  const handleCreateTask = async (columnId: string) => {
    await createTask({
      page_id: pageId,
      column_id: columnId,
      title: '',
    });
  };

  const handleUpdateColumnTitle = async (columnId: string, title: string) => {
    await updateColumn({ id: columnId, title });
  };

  const handleDeleteColumn = async (columnId: string) => {
    const columnTasks = tasksByColumn[columnId] || [];
    if (columnTasks.length > 0) {
      if (!confirm('This column has tasks. Delete them all?')) {
        return;
      }
      // Delete all tasks in the column
      for (const task of columnTasks) {
        await deleteTask(task.id);
      }
    }
    await deleteColumn(columnId);
  };

  const handleAddColumn = async () => {
    await createColumn({ title: 'New Column' });
  };

  if (columnsLoading || tasksLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[var(--color-text-tertiary)]" />
      </div>
    );
  }

  // If no columns, show option to create defaults
  if (columns.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <p className="text-[var(--color-text-secondary)]">
          This page doesn't have any columns yet.
        </p>
        <div className="flex gap-3">
          <button
            onClick={createDefaultColumns}
            className="flex items-center gap-2 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm text-white hover:bg-[var(--color-accent-hover)]"
          >
            <Plus size={16} />
            Create Default Columns
          </button>
          <button
            onClick={handleAddColumn}
            className="flex items-center gap-2 rounded-md border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]"
          >
            <Plus size={16} />
            Add Custom Column
          </button>
        </div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex h-full gap-4 overflow-x-auto p-4">
        <SortableContext
          items={columns.map((c) => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          {columns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tasks={tasksByColumn[column.id] || []}
              onCreateTask={() => handleCreateTask(column.id)}
              onUpdateTitle={(title) => handleUpdateColumnTitle(column.id, title)}
              onDelete={() => handleDeleteColumn(column.id)}
              onTaskClick={onTaskClick}
              onUpdateColumn={updateColumn}
            />
          ))}
        </SortableContext>

        <AddColumnButton onClick={handleAddColumn} />
      </div>

      <DragOverlay>
        {activeTask && (
          <TaskCard
            task={activeTask}
            onClick={() => {}}
            isDragging
          />
        )}
      </DragOverlay>
    </DndContext>
  );
}
