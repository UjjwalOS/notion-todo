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
import { toast } from 'sonner';
import { useColumns, useTasks } from '@/hooks';
import { useUIStore } from '@/stores';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { AddColumnButton } from './AddColumnButton';
import type { Task } from '@/types';
import { Plus } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui';
import { Button } from '@/components/ui/button';

// Type for tracking drop indicator position
export interface DropIndicator {
  columnId: string;
  index: number;
}

interface KanbanBoardProps {
  pageId: string;
  onTaskClick: (taskId: string) => void;
}

export function KanbanBoard({ pageId, onTaskClick }: KanbanBoardProps) {
  const { taskDataVersion } = useUIStore();

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
  } = useTasks({ pageId, refreshKey: taskDataVersion });

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);

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
    }
    // Note: Column dragging is handled by @dnd-kit/sortable automatically
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;

    if (!over) {
      setDropIndicator(null);
      return;
    }

    const activeData = active.data.current;
    const overData = over.data.current;

    if (activeData?.type !== 'task') {
      setDropIndicator(null);
      return;
    }

    // Determine target column and position for drop indicator
    let targetColumnId: string;
    let targetIndex: number;

    if (overData?.type === 'task') {
      targetColumnId = overData.task.column_id;
      const columnTasks = tasksByColumn[targetColumnId] || [];
      targetIndex = columnTasks.findIndex((t) => t.id === over.id);

      // If dragging over self, hide indicator
      if (active.id === over.id) {
        setDropIndicator(null);
        return;
      }
    } else if (overData?.type === 'column') {
      targetColumnId = overData.column.id;
      const columnTasks = tasksByColumn[targetColumnId] || [];
      targetIndex = columnTasks.length; // Drop at end of column
    } else {
      setDropIndicator(null);
      return;
    }

    setDropIndicator({ columnId: targetColumnId, index: targetIndex });
  };

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveTask(null);
      setDropIndicator(null);

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
    const result = await createTask({
      page_id: pageId,
      column_id: columnId,
      title: '',
    });
    if (!result) {
      toast.error('Failed to create task');
    }
  };

  const handleUpdateColumnTitle = async (columnId: string, title: string) => {
    const success = await updateColumn({ id: columnId, title });
    if (!success) {
      toast.error('Failed to update column');
    }
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
    const success = await deleteColumn(columnId);
    if (success) {
      toast.success('Column deleted');
    } else {
      toast.error('Failed to delete column');
    }
  };

  const handleAddColumn = async () => {
    const result = await createColumn({ title: 'New Column' });
    if (!result) {
      toast.error('Failed to create column');
    }
  };

  if (columnsLoading || tasksLoading) {
    return <LoadingSpinner />;
  }

  // If no columns, show option to create defaults
  if (columns.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-4 p-8">
        <p className="text-muted-foreground">
          This page doesn't have any columns yet.
        </p>
        <div className="flex gap-3">
          <Button onClick={createDefaultColumns}>
            <Plus className="h-4 w-4" />
            Create Default Columns
          </Button>
          <Button variant="outline" onClick={handleAddColumn}>
            <Plus className="h-4 w-4" />
            Add Custom Column
          </Button>
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
              dropIndicator={dropIndicator?.columnId === column.id ? dropIndicator : null}
              isDragActive={activeTask !== null}
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
