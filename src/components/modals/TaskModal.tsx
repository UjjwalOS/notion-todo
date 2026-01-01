import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useUIStore } from '@/stores';
import { useTasks } from '@/hooks';
import { TaskMetadataPanel } from './TaskMetadataPanel';
import { cn } from '@/lib/utils';
import type { Task, TaskUpdate } from '@/types';
import { PanelRight, Loader2 } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Lazy load the heavy TiptapEditor for faster modal opening
const TiptapEditor = lazy(() => import('./TiptapEditor').then(m => ({ default: m.TiptapEditor })));

interface TaskModalProps {
  pageId: string;
}

export function TaskModal({ pageId }: TaskModalProps) {
  const {
    taskModalOpen,
    taskModalTaskId,
    taskModalSidePanelOpen,
    closeTaskModal,
    toggleTaskModalSidePanel,
    invalidateTaskData,
  } = useUIStore();

  const { tasks, updateTask, deleteTask } = useTasks({ pageId });

  const [task, setTask] = useState<Task | null>(null);
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Find the task when modal opens
  useEffect(() => {
    if (taskModalTaskId && taskModalOpen) {
      const foundTask = tasks.find((t) => t.id === taskModalTaskId);
      if (foundTask) {
        setTask(foundTask);
        setTitle(foundTask.title);
      }
    } else {
      setTask(null);
      setTitle('');
    }
  }, [taskModalTaskId, taskModalOpen, tasks]);

  // Save task changes
  const handleSave = useCallback(
    async (updates: Partial<TaskUpdate>) => {
      if (!task) return;

      setIsSaving(true);
      try {
        await updateTask({ id: task.id, ...updates });
        // Signal that task data has changed so other components can refresh
        invalidateTaskData();
      } finally {
        setIsSaving(false);
      }
    },
    [task, updateTask, invalidateTaskData]
  );

  // Debounced title save
  useEffect(() => {
    if (!task || title === task.title) return;

    const timeout = setTimeout(() => {
      handleSave({ title });
    }, 500);

    return () => clearTimeout(timeout);
  }, [title, task, handleSave]);

  // Handle delete
  const handleDelete = async () => {
    if (!task) return;

    if (confirm('Move this task to trash?')) {
      await deleteTask(task.id);
      closeTaskModal();
    }
  };

  // Handle content change
  const handleContentChange = (content: Record<string, unknown>) => {
    handleSave({ content });
  };

  return (
    <Dialog open={taskModalOpen} onOpenChange={(open) => !open && closeTaskModal()}>
      <DialogContent
        className="flex h-[90vh] w-full max-w-5xl flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl"
        showCloseButton={true}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Edit your task details</DialogDescription>
        </DialogHeader>

        {!task ? (
          <div className="flex flex-1 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            {/* Main content area */}
            <div
              className={cn(
                'flex flex-1 flex-col overflow-hidden',
                taskModalSidePanelOpen ? 'border-r' : ''
              )}
            >
              {/* Header */}
              <div className="flex flex-shrink-0 items-center justify-between border-b px-6 py-3">
                <div className="flex items-center gap-2">
                  {isSaving && (
                    <span className="text-xs text-muted-foreground">
                      Saving...
                    </span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={toggleTaskModalSidePanel}
                  className={cn(
                    taskModalSidePanelOpen && 'bg-accent'
                  )}
                  title={taskModalSidePanelOpen ? 'Hide details' : 'Show details'}
                >
                  <PanelRight className="h-4 w-4" />
                </Button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {/* Title */}
                <Input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title"
                  className="mb-4 border-none bg-transparent text-2xl font-semibold shadow-none focus-visible:ring-0"
                />

                {/* Tiptap Editor - Lazy loaded */}
                <Suspense
                  fallback={
                    <div className="flex min-h-[200px] items-center justify-center">
                      <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                    </div>
                  }
                >
                  <TiptapEditor
                    content={task.content}
                    onChange={handleContentChange}
                  />
                </Suspense>
              </div>
            </div>

            {/* Side panel */}
            {taskModalSidePanelOpen && (
              <TaskMetadataPanel
                task={task}
                onUpdate={handleSave}
                onDelete={handleDelete}
              />
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
