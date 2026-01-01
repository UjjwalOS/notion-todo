import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { MoreHorizontal, Pencil, Trash2, X, Check } from 'lucide-react';
import { useAuthStore } from '@/stores';
import type { Comment } from '@/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CommentItemProps {
  comment: Comment;
  onUpdate: (id: string, content: string) => Promise<boolean>;
  onDelete: (id: string) => Promise<boolean>;
  compact?: boolean;
}

export function CommentItem({ comment, onUpdate, onDelete, compact = false }: CommentItemProps) {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isDeleting, setIsDeleting] = useState(false);

  const isOwner = user?.id === comment.user_id;
  const isEdited = comment.updated_at !== comment.created_at;

  // Get initials from user email (for now, since we don't have user profiles)
  const getInitials = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;

    const success = await onUpdate(comment.id, editContent.trim());
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent(comment.content);
    setIsEditing(false);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    await onDelete(comment.id);
    setIsDeleting(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // Parse content for images and render them
  const renderContent = (content: string) => {
    // Check if content contains image markdown or base64 images
    const imageRegex = /!\[.*?\]\((.*?)\)|<img[^>]+src="([^"]+)"[^>]*>/g;
    const parts: (string | JSX.Element)[] = [];
    let lastIndex = 0;
    let match;

    while ((match = imageRegex.exec(content)) !== null) {
      // Add text before the image
      if (match.index > lastIndex) {
        parts.push(content.slice(lastIndex, match.index));
      }

      // Add the image
      const imageSrc = match[1] || match[2];
      parts.push(
        <img
          key={match.index}
          src={imageSrc}
          alt="comment image"
          className="my-2 max-w-full rounded-md"
          style={{ maxHeight: '300px' }}
        />
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push(content.slice(lastIndex));
    }

    return parts.length > 0 ? parts : content;
  };

  // Typography based on industry standards (Linear, Slack, Material Design):
  // - Compact mode: 13px body, 12px secondary (minimum readable per WCAG)
  // - Normal mode: 14px body, 12px secondary
  // - Line height: 1.4-1.5x for readability

  return (
    <div className={`group flex ${compact ? 'gap-2 py-1.5' : 'gap-3 py-3'}`}>
      {/* Avatar */}
      <div className={`flex flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] font-medium text-[var(--color-on-accent)] ${compact ? 'h-6 w-6 text-xs' : 'h-8 w-8 text-sm'}`}>
        {getInitials()}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 overflow-hidden">
        {/* Header */}
        <div className={`flex items-center ${compact ? 'gap-1.5 mb-0.5' : 'gap-2 mb-1'}`}>
          <span className={`font-medium text-[var(--color-text-primary)] truncate ${compact ? 'text-[13px]' : 'text-sm'}`}>
            {user?.email?.split('@')[0] || 'User'}
          </span>
          <span className={`text-[var(--color-text-tertiary)] whitespace-nowrap ${compact ? 'text-xs' : 'text-xs'}`}>
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
          </span>
          {isEdited && (
            <span className={`text-[var(--color-text-tertiary)] ${compact ? 'text-xs' : 'text-xs'}`}>(edited)</span>
          )}
          {/* Three-dot menu for owner actions */}
          {isOwner && !isEditing && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={`rounded p-0.5 text-[var(--color-text-tertiary)] opacity-0 transition-opacity hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-secondary)] group-hover:opacity-100 ${compact ? 'ml-auto' : ''}`}
                >
                  <MoreHorizontal size={compact ? 14 : 16} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-32">
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Pencil size={14} className="mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="text-[var(--color-danger)] focus:text-[var(--color-danger)]"
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Body */}
        {isEditing ? (
          <div className="space-y-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={handleKeyDown}
              className={`w-full resize-none rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] px-3 py-2 text-[var(--color-text-primary)] focus:border-[var(--color-accent)] focus:outline-none ${compact ? 'text-[13px]' : 'text-sm'}`}
              rows={3}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-1 rounded-md bg-[var(--color-accent)] px-2 py-1 text-xs text-[var(--color-on-accent)] hover:bg-[var(--color-accent-hover)]"
              >
                <Check size={12} />
                Save
              </button>
              <button
                onClick={handleCancelEdit}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-hover)]"
              >
                <X size={12} />
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className={`whitespace-pre-wrap break-words text-[var(--color-text-primary)] ${compact ? 'text-[13px] leading-[1.4]' : 'text-sm leading-relaxed'}`}>
            {renderContent(comment.content)}
          </div>
        )}
      </div>
    </div>
  );
}
