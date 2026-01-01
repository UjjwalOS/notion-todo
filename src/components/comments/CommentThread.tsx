import { toast } from 'sonner';
import { MessageSquare, Loader2 } from 'lucide-react';
import { useComments } from '@/hooks';
import { CommentItem } from './CommentItem';
import { CommentInput } from './CommentInput';

interface CommentThreadProps {
  taskId: string;
}

export function CommentThread({ taskId }: CommentThreadProps) {
  const {
    comments,
    commentCount,
    isLoading,
    createComment,
    updateComment,
    deleteComment,
  } = useComments({ taskId });

  const handleAddComment = async (content: string): Promise<boolean> => {
    const result = await createComment({
      task_id: taskId,
      content,
    });

    if (result) {
      toast.success('Comment added');
      return true;
    }
    return false;
  };

  const handleUpdateComment = async (id: string, content: string): Promise<boolean> => {
    const success = await updateComment({ id, content });
    if (success) {
      toast.success('Comment updated');
    } else {
      toast.error('Failed to update comment');
    }
    return success;
  };

  const handleDeleteComment = async (id: string): Promise<boolean> => {
    const success = await deleteComment(id);
    if (success) {
      toast.success('Comment deleted');
    } else {
      toast.error('Failed to delete comment');
    }
    return success;
  };

  if (isLoading) {
    return (
      <div className="mt-6 border-t border-[var(--color-border)] pt-4">
        <div className="flex items-center justify-center py-4">
          <Loader2 size={20} className="animate-spin text-[var(--color-text-tertiary)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-[var(--color-border)] pt-4">
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <MessageSquare size={16} className="text-[var(--color-text-tertiary)]" />
        <h3 className="text-sm font-medium text-[var(--color-text-primary)]">
          Comments {commentCount > 0 && `(${commentCount})`}
        </h3>
      </div>

      {/* Comments list */}
      {comments.length > 0 ? (
        <div className="divide-y divide-[var(--color-border)]">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              onUpdate={handleUpdateComment}
              onDelete={handleDeleteComment}
            />
          ))}
        </div>
      ) : (
        <p className="py-4 text-center text-sm text-[var(--color-text-tertiary)]">
          No comments yet. Add one below.
        </p>
      )}

      {/* Input */}
      <CommentInput onSubmit={handleAddComment} />
    </div>
  );
}
