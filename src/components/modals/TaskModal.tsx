import { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { useUIStore } from '@/stores';
import { useTasks } from '@/hooks';
import { TaskMetadataPanel } from './TaskMetadataPanel';
import { cn } from '@/lib/utils';
import type { Task, TaskUpdate } from '@/types';
import { X, PanelRight, Loader2 } from 'lucide-react';

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
      } finally {
        setIsSaving(false);
      }
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

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && taskModalOpen) {
        closeTaskModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [taskModalOpen, closeTaskModal]);

  if (!taskModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={closeTaskModal}
      />

      {/* Modal */}
      <div className="relative flex h-[90vh] w-full max-w-5xl overflow-hidden rounded-lg bg-[var(--color-bg-primary)] shadow-xl">
        {!task ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 size={24} className="animate-spin text-[var(--color-text-tertiary)]" />
          </div>
        ) : (
          <>
            {/* Main content area */}
            <div
              className={cn(
                'flex flex-1 flex-col overflow-hidden',
                taskModalSidePanelOpen ? 'border-r border-[var(--color-border)]' : ''
              )}
            >
              {/* Header */}
              <div className="flex flex-shrink-0 items-center justify-between border-b border-[var(--color-border)] px-6 py-3">
                <div className="flex items-center gap-2">
                  {isSaving && (
                    <span className="text-xs text-[var(--color-text-tertiary)]">
                      Saving...
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={toggleTaskModalSidePanel}
                    className={cn(
                      'rounded p-2 transition-colors',
                      taskModalSidePanelOpen
                        ? 'bg-[var(--color-bg-hover)] text-[var(--color-text-primary)]'
                        : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]'
                    )}
                    title={taskModalSidePanelOpen ? 'Hide details' : 'Show details'}
                  >
                    <PanelRight size={18} />
                  </button>
                  <button
                    onClick={closeTaskModal}
                    className="rounded p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {/* Title */}
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Task title"
                  className="mb-4 w-full border-none bg-transparent text-2xl font-semibold text-[var(--color-text-primary)] outline-none placeholder:text-[var(--color-text-tertiary)]"
                />

                {/* Tiptap Editor - Lazy loaded */}
                <Suspense
                  fallback={
                    <div className="flex min-h-[200px] items-center justify-center">
                      <Loader2 size={20} className="animate-spin text-[var(--color-text-tertiary)]" />
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
          </>
        )}
      </div>
    </div>
  );
}
