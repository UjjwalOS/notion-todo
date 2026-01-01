import { useState, useCallback, useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type CollisionDetection,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { toast } from 'sonner';
import { useColumns } from '@/hooks';
import { useSelectionStore } from '@/stores';
import { KanbanColumn } from './KanbanColumn';
import { TaskCard } from './TaskCard';
import { TaskContextMenu } from './TaskContextMenu';
import { AddColumnButton } from './AddColumnButton';
import type { Task, TaskInsert } from '@/types';
import { Plus } from 'lucide-react';
import { LoadingSpinner, ConfirmDialog } from '@/components/ui';
import { Button } from '@/components/ui/button';

// Type for tracking drop indicator position
export interface DropIndicator {
  columnId: string;
  index: number;
}

// Type for the tasks hook return value (passed from parent)
interface TasksHookReturn {
  tasks: Task[];
  tasksByColumn: Record<string, Task[]>;
  isLoading: boolean;
  createTask: (data: Omit<TaskInsert, 'user_id'>) => Promise<Task | null>;
  deleteTask: (id: string) => Promise<boolean>;
  duplicateTask: (id: string) => Promise<Task | null>;
  moveTask: (taskId: string, targetColumnId: string, targetPosition: number) => Promise<boolean>;
}

interface KanbanBoardProps {
  pageId: string;
  onTaskClick: (taskId: string) => void;
  tasksHook: TasksHookReturn;
}

export function KanbanBoard({ pageId, onTaskClick, tasksHook }: KanbanBoardProps) {
  const { selectedTaskIds, clearSelection, selectMultipleTasks, closeContextMenu } = useSelectionStore();

  const {
    columns,
    isLoading: columnsLoading,
    createColumn,
    updateColumn,
    deleteColumn,
    reorderColumns,
    createDefaultColumns,
  } = useColumns(pageId);

  // Use the shared tasks hook from parent - no duplicate API calls!
  const {
    tasks,
    tasksByColumn,
    isLoading: tasksLoading,
    createTask,
    deleteTask,
    duplicateTask,
    moveTask,
  } = tasksHook;

  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    taskIds: string[];
    hasContent: boolean;
  }>({ isOpen: false, taskIds: [], hasContent: false });

  // Handle keyboard shortcuts for selection
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      // Don't handle shortcuts when typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      // Delete selected tasks
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedTaskIds.size > 0) {
          e.preventDefault();
          await handleDeleteSelectedTasks(Array.from(selectedTaskIds));
        }
      }

      // Escape to clear selection
      if (e.key === 'Escape') {
        clearSelection();
        closeContextMenu();
      }

      // Ctrl/Cmd + A to select all tasks on current page
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        const allTaskIds = tasks.map((t) => t.id);
        selectMultipleTasks(allTaskIds);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedTaskIds, tasks, clearSelection, closeContextMenu, selectMultipleTasks]);

  // Clear selection when clicking on board background
  const handleBoardClick = (e: React.MouseEvent) => {
    // Only clear if clicking directly on the board (not on a card or column)
    if (e.target === e.currentTarget) {
      clearSelection();
    }
  };

  // Check if a task has meaningful content (title or description)
  const taskHasContent = (task: Task): boolean => {
    // Check if task has a non-empty title
    if (task.title && task.title.trim().length > 0) return true;

    // Check if task has content in the editor
    if (task.content) {
      try {
        const content = task.content as { content?: Array<{ type: string; content?: Array<{ text?: string }> }> };
        if (content.content) {
          for (const block of content.content) {
            if (block.type === 'paragraph' && block.content) {
              for (const item of block.content) {
                if (item.text && item.text.trim().length > 0) {
                  return true;
                }
              }
            }
            // Also check for images
            if (block.type === 'image') {
              return true;
            }
          }
        }
      } catch {
        // Invalid content format
      }
    }

    return false;
  };

  // Delete multiple selected tasks
  const handleDeleteSelectedTasks = async (taskIds: string[]) => {
    if (taskIds.length === 0) return;

    // Check if any tasks have content
    const tasksToDelete = taskIds.map(id => tasks.find(t => t.id === id)).filter(Boolean) as Task[];
    const anyHasContent = tasksToDelete.some(task => taskHasContent(task));

    // If tasks have content, show confirmation dialog
    if (anyHasContent) {
      setDeleteConfirmation({
        isOpen: true,
        taskIds,
        hasContent: true,
      });
      return;
    }

    // Otherwise, delete directly without confirmation
    await executeDelete(taskIds);
  };

  // Actually perform the deletion
  const executeDelete = async (taskIds: string[]) => {
    let deletedCount = 0;
    for (const taskId of taskIds) {
      const success = await deleteTask(taskId);
      if (success) deletedCount++;
    }

    clearSelection();

    if (deletedCount === taskIds.length) {
      toast.success(`Deleted ${deletedCount} task${deletedCount !== 1 ? 's' : ''}`);
    } else {
      toast.error(`Failed to delete some tasks`);
    }
  };

  // Duplicate a single task
  const handleDuplicateTask = async (taskId: string) => {
    const result = await duplicateTask(taskId);
    if (result) {
      toast.success('Task duplicated');
    } else {
      toast.error('Failed to duplicate task');
    }
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor)
  );

  // Custom collision detection that prioritizes tasks over columns
  // but falls back to column droppable zones for empty columns
  const customCollisionDetection: CollisionDetection = useCallback((args) => {
    // First, check for pointer within any droppable (most accurate)
    const pointerCollisions = pointerWithin(args);

    // If we found collisions with pointerWithin, filter to prefer tasks
    if (pointerCollisions.length > 0) {
      // Prefer task collisions over column collisions
      const taskCollision = pointerCollisions.find(
        (collision) => collision.data?.droppableContainer?.data?.current?.type === 'task'
      );
      if (taskCollision) {
        return [taskCollision];
      }
      // Return column collisions (including column-drop-* droppables)
      return pointerCollisions;
    }

    // Fall back to rect intersection for edge cases
    return rectIntersection(args);
  }, []);

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const activeData = active.data.current;

    if (activeData?.type === 'task') {
      const task = activeData.task;
      setActiveTask(task);

      // If dragging a task that's not selected, clear selection and select only this one
      if (!selectedTaskIds.has(task.id)) {
        clearSelection();
      }
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
      const overTaskIndex = columnTasks.findIndex((t) => t.id === over.id);

      // If dragging over self, hide indicator
      if (active.id === over.id) {
        setDropIndicator(null);
        return;
      }

      // Calculate if we should show indicator above or below the hovered task
      // based on the drag position relative to the task
      const activeTask = activeData.task;
      const activeColumnTasks = tasksByColumn[activeTask.column_id] || [];
      const activeTaskIndex = activeColumnTasks.findIndex((t) => t.id === active.id);

      // If in same column and dragging down, show indicator after the hovered task
      // If in same column and dragging up, show indicator before the hovered task
      // If different column, show indicator at the hovered position
      if (activeTask.column_id === targetColumnId && activeTaskIndex < overTaskIndex) {
        targetIndex = overTaskIndex + 1;
      } else {
        targetIndex = overTaskIndex;
      }
    } else if (overData?.type === 'column') {
      // Dropping onto a column (either the sortable column or the droppable zone inside)
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
        const draggedTask = activeData.task;
        let targetColumnId: string;
        let targetPosition: number;

        if (overData?.type === 'task') {
          targetColumnId = overData.task.column_id;
          const columnTasks = tasksByColumn[targetColumnId] || [];
          const overTaskIndex = columnTasks.findIndex((t) => t.id === over.id);

          // Calculate position consistently with handleDragOver
          const activeColumnTasks = tasksByColumn[draggedTask.column_id] || [];
          const activeTaskIndex = activeColumnTasks.findIndex((t) => t.id === active.id);

          if (draggedTask.column_id === targetColumnId && activeTaskIndex < overTaskIndex) {
            targetPosition = overTaskIndex;
          } else {
            targetPosition = overTaskIndex;
          }
        } else if (overData?.type === 'column') {
          // Dropping onto a column (either the sortable column or the droppable zone inside)
          targetColumnId = overData.column.id;
          const columnTasks = tasksByColumn[targetColumnId] || [];
          targetPosition = columnTasks.length; // Drop at end of column
        } else {
          return;
        }

        // Check if we're moving multiple selected tasks
        const tasksToMove = selectedTaskIds.size > 1 && selectedTaskIds.has(draggedTask.id)
          ? Array.from(selectedTaskIds)
          : [draggedTask.id];

        // Move all selected tasks to the target column
        let successCount = 0;
        for (let i = 0; i < tasksToMove.length; i++) {
          const taskId = tasksToMove[i];
          const task = tasks.find((t) => t.id === taskId);
          if (!task) continue;

          // Skip if task is already in the right position (for single task move)
          if (
            tasksToMove.length === 1 &&
            task.column_id === targetColumnId &&
            task.position === targetPosition
          ) {
            continue;
          }

          const success = await moveTask(taskId, targetColumnId, targetPosition + i);
          if (success) successCount++;
        }

        if (successCount === 0 && tasksToMove.length > 0) {
          toast.error('Failed to move task' + (tasksToMove.length > 1 ? 's' : ''));
        }

        // Clear selection after moving multiple tasks
        if (tasksToMove.length > 1) {
          clearSelection();
        }
      }
    },
    [columns, tasksByColumn, tasks, selectedTaskIds, reorderColumns, moveTask, clearSelection]
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
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={customCollisionDetection}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div
          className="flex h-full gap-4 overflow-x-auto p-4"
          onClick={handleBoardClick}
        >
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
            <div className="relative">
              <TaskCard
                task={activeTask}
                onClick={() => {}}
                isDragging
              />
              {/* Show count badge when dragging multiple tasks */}
              {selectedTaskIds.size > 1 && selectedTaskIds.has(activeTask.id) && (
                <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-lg">
                  {selectedTaskIds.size}
                </div>
              )}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Context menu for selected tasks */}
      <TaskContextMenu
        onDelete={handleDeleteSelectedTasks}
        onDuplicate={handleDuplicateTask}
      />

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={deleteConfirmation.isOpen}
        onOpenChange={(open) => setDeleteConfirmation(prev => ({ ...prev, isOpen: open }))}
        title={deleteConfirmation.taskIds.length === 1 ? 'Delete task?' : `Delete ${deleteConfirmation.taskIds.length} tasks?`}
        description="This action cannot be undone. The task and all its content will be permanently deleted."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={() => executeDelete(deleteConfirmation.taskIds)}
        onCancel={() => setDeleteConfirmation({ isOpen: false, taskIds: [], hasContent: false })}
      />
    </>
  );
}
