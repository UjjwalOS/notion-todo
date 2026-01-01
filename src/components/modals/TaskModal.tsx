import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { useUIStore } from '@/stores';
import { TaskMetadataPanel } from './TaskMetadataPanel';
import { cn } from '@/lib/utils';
import type { Task, TaskUpdate } from '@/types';
import { PanelRight, Loader2, X } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

// Lazy load the heavy TiptapEditor for faster modal opening
const TiptapEditor = lazy(() => import('./TiptapEditor').then(m => ({ default: m.TiptapEditor })));

// Type for the tasks hook return value
interface TasksHookReturn {
  tasks: Task[];
  isLoading: boolean;
  updateTask: (data: TaskUpdate) => Promise<boolean>;
  deleteTask: (id: string) => Promise<boolean>;
}

interface TaskModalProps {
  pageId: string;
  tasksHook: TasksHookReturn;
}

export function TaskModal({ pageId, tasksHook }: TaskModalProps) {
  const {
    taskModalOpen,
    taskModalTaskId,
    taskModalSidePanelOpen,
    closeTaskModal,
    toggleTaskModalSidePanel,
    invalidateTaskData,
  } = useUIStore();

  // Use the shared tasks hook from parent - no duplicate API calls!
  const { tasks, isLoading: tasksLoading, updateTask, deleteTask } = tasksHook;

  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Use a ref to track if we've ever found the task - refs persist across renders without causing re-renders
  const hasFoundTaskRef = useRef(false);
  // Track the current modal session to know when to reset
  const currentSessionRef = useRef<string | null>(null);

  // Create a Map for O(1) task lookup instead of O(n) find()
  const taskMap = useMemo(() => {
    const map = new Map<string, Task>();
    tasks.forEach(t => map.set(t.id, t));
    return map;
  }, [tasks]);

  // Get the current task from the map
  const task = taskModalTaskId ? taskMap.get(taskModalTaskId) ?? null : null;

  // Reset ref when modal opens with a different task
  if (taskModalOpen && taskModalTaskId !== currentSessionRef.current) {
    currentSessionRef.current = taskModalTaskId;
    hasFoundTaskRef.current = false;
  }

  // Reset when modal closes
  if (!taskModalOpen && currentSessionRef.current !== null) {
    currentSessionRef.current = null;
    hasFoundTaskRef.current = false;
  }

  // Mark as found if we have the task
  if (task && !hasFoundTaskRef.current) {
    hasFoundTaskRef.current = true;
  }

  // Sync title with task
  useEffect(() => {
    if (task) {
      setTitle(task.title);
    } else if (!taskModalOpen) {
      setTitle('');
    }
  }, [task, taskModalOpen]);

  // Simple logic: show loading if modal is open but we don't have a task yet (and haven't found one before)
  const showLoading = taskModalOpen && !task && !hasFoundTaskRef.current;
  // Never show "Task not found" - if the task disappears after we found it, just show loading or close
  // This prevents false "not found" during re-renders and state updates

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
      const taskId = task.id;
      closeTaskModal();
      await deleteTask(taskId);
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
        showCloseButton={false}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>Edit your task details</DialogDescription>
        </DialogHeader>

        {showLoading ? (
          <div className="flex flex-1 items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : task ? (
          <div className="flex flex-1 overflow-hidden">
            {/* Main content area */}
            <div
              className={cn(
                'flex flex-1 flex-col overflow-hidden transition-[border] duration-200',
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
                <div className="flex items-center gap-1">
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
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={closeTaskModal}
                    title="Close"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {/* Title - Notion-style large heading */}
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled"
                  className="mb-2 w-full border-none bg-transparent text-[40px] font-bold leading-tight text-foreground placeholder:text-muted-foreground/50 outline-none ring-0 focus:outline-none focus:ring-0 focus:border-none focus-visible:outline-none focus-visible:ring-0"
                  style={{ outline: 'none', boxShadow: 'none' }}
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

            {/* Side panel - with smooth slide animation */}
            <div
              className={cn(
                'flex-shrink-0 overflow-hidden transition-all duration-200 ease-out',
                taskModalSidePanelOpen ? 'w-72 opacity-100' : 'w-0 opacity-0'
              )}
            >
              <div className="h-full w-72">
                <TaskMetadataPanel
                  task={task}
                  onUpdate={handleSave}
                  onDelete={handleDelete}
                />
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
