import { useState, useRef, useCallback, useEffect } from 'react';
import { ImagePlus, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores';
import { processImageFile } from '@/lib/upload-image';

interface CommentInputProps {
  onSubmit: (content: string) => Promise<boolean>;
  compact?: boolean;
}

export function CommentInput({ onSubmit, compact = false }: CommentInputProps) {
  const { user } = useAuthStore();
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, []);

  useEffect(() => {
    adjustHeight();
  }, [content, adjustHeight]);

  const handleSubmit = async () => {
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const success = await onSubmit(content.trim());
      if (success) {
        setContent('');
        // Reset textarea height
        if (textareaRef.current) {
          textareaRef.current.style.height = 'auto';
        }
      } else {
        toast.error('Failed to add comment');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Submit on Enter, new line on Shift+Enter
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const imageUrl = await processImageFile(file);
      // Insert image as markdown
      const imageMarkdown = `![image](${imageUrl})`;
      setContent((prev) => {
        const newContent = prev ? `${prev}\n${imageMarkdown}` : imageMarkdown;
        return newContent;
      });
      toast.success('Image added');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle paste for images
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          await handleImageUpload(file);
        }
        return;
      }
    }
  };

  // Get initials for avatar
  const getInitials = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  // Compact mode: no avatar, optimized input for side panel
  // Typography: 13px minimum for input text (WCAG readable minimum is 12px)
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 min-w-0 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Add comment..."
            className="w-full resize-none border-none bg-transparent px-2.5 py-1.5 text-[13px] leading-[1.4] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none ring-0 focus:border-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
            style={{ outline: 'none', boxShadow: 'none', maxHeight: '80px' }}
            rows={1}
            disabled={isSubmitting}
          />
        </div>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isSubmitting}
          className="flex-shrink-0 rounded p-1.5 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-secondary)] disabled:opacity-50"
          title="Add image"
        >
          <ImagePlus size={14} />
        </button>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isSubmitting}
          className="flex-shrink-0 rounded-md bg-[var(--color-accent)] p-1.5 text-[var(--color-on-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
          title="Send"
        >
          {isSubmitting ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Send size={14} />
          )}
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-3 pt-3">
      {/* Avatar */}
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-medium text-[var(--color-on-accent)]">
        {getInitials()}
      </div>

      {/* Input area */}
      <div className="min-w-0 flex-1">
        <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder="Add a comment..."
            className="w-full resize-none border-none bg-transparent px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none ring-0 focus:border-none focus:outline-none focus:ring-0 focus-visible:outline-none focus-visible:ring-0"
            style={{ outline: 'none', boxShadow: 'none' }}
            rows={1}
            disabled={isSubmitting}
          />

          {/* Action buttons */}
          <div className="flex items-center justify-between border-t border-[var(--color-border)] px-2 py-1">
            <div className="flex items-center gap-1">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Image upload button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
                className="rounded p-1.5 text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-hover)] hover:text-[var(--color-text-secondary)] disabled:opacity-50"
                title="Add image"
              >
                <ImagePlus size={16} />
              </button>
            </div>

            {/* Submit button */}
            <button
              onClick={handleSubmit}
              disabled={!content.trim() || isSubmitting}
              className="flex items-center gap-1 rounded-md bg-[var(--color-accent)] px-3 py-1 text-xs font-medium text-[var(--color-on-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Send size={12} />
              )}
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
