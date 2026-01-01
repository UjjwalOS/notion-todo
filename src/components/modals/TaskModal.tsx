import { useState, useEffect, useCallback, useMemo, useRef, lazy, Suspense } from 'react';
import { useUIStore } from '@/stores';
import { TaskSidePanel } from './TaskSidePanel';
import { cn } from '@/lib/utils';
import type { Task, TaskUpdate } from '@/types';
import { PanelRight, Loader2, X } from 'lucide-react';
import { LoadingSpinner, ConfirmDialog } from '@/components/ui';
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
  tasksHook: TasksHookReturn;
}

export function TaskModal({ tasksHook }: TaskModalProps) {
  const {
    taskModalOpen,
    taskModalTaskId,
    taskModalSidePanelOpen,
    closeTaskModal,
    toggleTaskModalSidePanel,
    invalidateTaskData,
  } = useUIStore();

  // Use the shared tasks hook from parent - no duplicate API calls!
  const { tasks, updateTask, deleteTask } = tasksHook;

  const [title, setTitle] = useState('');
  const [pendingContent, setPendingContent] = useState<Record<string, unknown> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [sidePanelWidth, setSidePanelWidth] = useState(288); // 288px = 18rem default
  const titleInputRef = useRef<HTMLInputElement>(null);
  const shouldFocusTitleRef = useRef(false);

  // Min and max width for side panel
  const MIN_PANEL_WIDTH = 240; // 15rem
  const MAX_PANEL_WIDTH = 480; // 30rem

  const handlePanelResize = useCallback((delta: number) => {
    setSidePanelWidth(prev => {
      const newWidth = prev + delta;
      return Math.min(MAX_PANEL_WIDTH, Math.max(MIN_PANEL_WIDTH, newWidth));
    });
  }, []);

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

  // Sync title with task and auto-focus for new tasks
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      // If this is a new task (empty title), mark for focus
      if (!task.title) {
        shouldFocusTitleRef.current = true;
      }
    } else if (!taskModalOpen) {
      setTitle('');
      shouldFocusTitleRef.current = false;
    }
  }, [task, taskModalOpen]);

  // Auto-focus title input when opening a new task
  useEffect(() => {
    if (task && shouldFocusTitleRef.current && titleInputRef.current) {
      // Small delay to ensure the dialog is fully rendered
      const timeout = setTimeout(() => {
        titleInputRef.current?.focus();
        titleInputRef.current?.select();
        shouldFocusTitleRef.current = false;
      }, 50);
      return () => clearTimeout(timeout);
    }
  }, [task]);

  // Simple logic: show loading if modal is open but we don't have a task yet (and haven't found one before)
  const showLoading = taskModalOpen && !task && !hasFoundTaskRef.current;
  // Never show "Task not found" - if the task disappears after we found it, just show loading or close
  // This prevents false "not found" during re-renders and state updates

  // Save task changes (with UI feedback for important changes)
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

  // Silent save for content - no UI state updates to prevent flicker
  const handleSilentSave = useCallback(
    async (updates: Partial<TaskUpdate>) => {
      if (!task) return;
      await updateTask({ id: task.id, ...updates });
    },
    [task, updateTask]
  );

  // Debounced title save
  useEffect(() => {
    if (!task || title === task.title) return;

    const timeout = setTimeout(() => {
      handleSave({ title });
    }, 500);

    return () => clearTimeout(timeout);
  }, [title, task, handleSave]);

  // Debounced content save - uses silent save to prevent background flicker
  useEffect(() => {
    if (!task || !pendingContent) return;

    const timeout = setTimeout(() => {
      handleSilentSave({ content: pendingContent });
      setPendingContent(null);
    }, 500);

    return () => clearTimeout(timeout);
  }, [pendingContent, task, handleSilentSave]);

  // Handle delete - show confirmation dialog
  const handleDelete = () => {
    if (!task) return;
    setShowDeleteConfirm(true);
  };

  // Execute delete after confirmation
  const executeDelete = async () => {
    if (!task) return;
    const taskId = task.id;
    closeTaskModal();
    await deleteTask(taskId);
  };

  // Handle content change - debounced via useEffect
  const handleContentChange = (content: Record<string, unknown>) => {
    setPendingContent(content);
  };

  return (
    <>
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
                  ref={titleInputRef}
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
                taskModalSidePanelOpen ? 'opacity-100' : 'w-0 opacity-0'
              )}
              style={{ width: taskModalSidePanelOpen ? sidePanelWidth : 0 }}
            >
              <TaskSidePanel
                task={task}
                onUpdate={handleSave}
                onDelete={handleDelete}
                width={sidePanelWidth}
                onResize={handlePanelResize}
              />
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Move to trash?"
        description="This task will be moved to trash. You can restore it later from the trash."
        confirmLabel="Delete"
        cancelLabel="Cancel"
        variant="destructive"
        onConfirm={executeDelete}
      />
    </>
  );
}
