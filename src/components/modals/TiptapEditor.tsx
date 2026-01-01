import { useCallback, useEffect, useState, useRef } from 'react';
import { useEditor, EditorContent, NodeViewWrapper, ReactNodeViewRenderer } from '@tiptap/react';
import type { NodeViewProps } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { FileHandler } from '@tiptap/extension-file-handler';
import {
  Loader2,
  ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare
} from 'lucide-react';
import { toast } from 'sonner';

interface TiptapEditorProps {
  content: Record<string, unknown> | null;
  onChange: (content: Record<string, unknown>) => void;
}

interface SlashMenuItem {
  title: string;
  command: string;
  description: string;
}

const SLASH_MENU_ITEMS: SlashMenuItem[] = [
  { title: 'Heading 1', command: 'h1', description: 'Large heading' },
  { title: 'Heading 2', command: 'h2', description: 'Medium heading' },
  { title: 'Heading 3', command: 'h3', description: 'Small heading' },
  { title: 'Bullet List', command: 'bullet', description: 'Create a bullet list' },
  { title: 'Numbered List', command: 'numbered', description: 'Create a numbered list' },
  { title: 'To-do', command: 'todo', description: 'Create a checkbox list' },
  { title: 'Image', command: 'image', description: 'Upload or paste an image' },
];

// Image constraints
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MIN_IMAGE_WIDTH = 50;
const MAX_IMAGE_WIDTH = 800;
const MIN_IMAGE_HEIGHT = 50;
const MAX_IMAGE_HEIGHT = 600;

// Helper to process image file
const processImageFile = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_IMAGE_SIZE) {
      reject(new Error('Image must be smaller than 5MB'));
      return;
    }

    if (!file.type.startsWith('image/')) {
      reject(new Error('File must be an image'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        resolve(result);
      } else {
        reject(new Error('Failed to read image'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read image'));
    reader.readAsDataURL(file);
  });
};

// Resizable Image Component
function ResizableImageComponent({ node, updateAttributes, selected }: NodeViewProps) {
  const [isResizing, setIsResizing] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);

    const startX = e.clientX;
    const startWidth = imageRef.current?.offsetWidth || 300;
    const startHeight = imageRef.current?.offsetHeight || 200;
    const aspectRatio = startWidth / startHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      let newWidth = startWidth;
      let newHeight = startHeight;

      if (direction.includes('right')) {
        newWidth = startWidth + (moveEvent.clientX - startX);
      } else if (direction.includes('left')) {
        newWidth = startWidth - (moveEvent.clientX - startX);
      }

      // Maintain aspect ratio
      newHeight = newWidth / aspectRatio;

      // Apply constraints
      newWidth = Math.max(MIN_IMAGE_WIDTH, Math.min(MAX_IMAGE_WIDTH, newWidth));
      newHeight = Math.max(MIN_IMAGE_HEIGHT, Math.min(MAX_IMAGE_HEIGHT, newHeight));

      // Recalculate to maintain aspect ratio within constraints
      if (newHeight > MAX_IMAGE_HEIGHT) {
        newHeight = MAX_IMAGE_HEIGHT;
        newWidth = newHeight * aspectRatio;
      }

      updateAttributes({
        width: Math.round(newWidth),
        height: Math.round(newHeight),
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <NodeViewWrapper className="relative inline-block my-2">
      <div
        ref={containerRef}
        className={`relative inline-block ${selected ? 'ring-2 ring-[var(--color-accent)] ring-offset-2' : ''}`}
      >
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt || ''}
          width={node.attrs.width || undefined}
          height={node.attrs.height || undefined}
          className="rounded-md max-w-full block"
          style={{
            width: node.attrs.width ? `${node.attrs.width}px` : 'auto',
            height: node.attrs.height ? `${node.attrs.height}px` : 'auto',
            maxWidth: `${MAX_IMAGE_WIDTH}px`,
            maxHeight: `${MAX_IMAGE_HEIGHT}px`,
            minWidth: `${MIN_IMAGE_WIDTH}px`,
            minHeight: `${MIN_IMAGE_HEIGHT}px`,
          }}
          draggable={false}
        />

        {/* Resize handles - only show when selected */}
        {selected && (
          <>
            {/* Right handle */}
            <div
              className="absolute top-1/2 -right-2 w-4 h-8 -translate-y-1/2 cursor-ew-resize bg-[var(--color-accent)] rounded-sm opacity-80 hover:opacity-100 flex items-center justify-center"
              onMouseDown={(e) => handleMouseDown(e, 'right')}
            >
              <div className="w-0.5 h-4 bg-[var(--color-on-accent)] rounded-full" />
            </div>

            {/* Left handle */}
            <div
              className="absolute top-1/2 -left-2 w-4 h-8 -translate-y-1/2 cursor-ew-resize bg-[var(--color-accent)] rounded-sm opacity-80 hover:opacity-100 flex items-center justify-center"
              onMouseDown={(e) => handleMouseDown(e, 'left')}
            >
              <div className="w-0.5 h-4 bg-[var(--color-on-accent)] rounded-full" />
            </div>
          </>
        )}

        {/* Resizing indicator */}
        {isResizing && (
          <div className="absolute bottom-2 right-2 bg-[var(--gray-950)]/70 text-[var(--color-on-accent)] text-xs px-2 py-1 rounded">
            {node.attrs.width || '?'} × {node.attrs.height || '?'}
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
}

// Custom Image Extension with resize support
const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (element) => element.getAttribute('width'),
        renderHTML: (attributes) => {
          if (!attributes.width) return {};
          return { width: attributes.width };
        },
      },
      height: {
        default: null,
        parseHTML: (element) => element.getAttribute('height'),
        renderHTML: (attributes) => {
          if (!attributes.height) return {};
          return { height: attributes.height };
        },
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const slashMenuRef = useRef<HTMLDivElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Capture content on mount only - we intentionally skip updates to prevent editor resets
  const [initialContent] = useState(() => content || {
    type: 'doc',
    content: [{ type: 'paragraph' }],
  });

  // Handle image insertion from file
  const insertImage = useCallback((editor: ReturnType<typeof useEditor>, src: string, alt?: string) => {
    editor?.chain().focus().setImage({ src, alt: alt || 'image' }).run();
  }, []);

  // Create extensions with file handler
  const extensions = [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3],
      },
    }),
    Placeholder.configure({
      placeholder: 'Type "/" for commands...',
      showOnlyWhenEditable: true,
      showOnlyCurrent: false,
      includeChildren: false,
    }),
    TaskList,
    TaskItem.configure({
      nested: true,
      HTMLAttributes: {
        class: 'task-item',
      },
    }),
    ResizableImage.configure({
      inline: false,
      allowBase64: true,
      HTMLAttributes: {
        class: 'resizable-image',
      },
    }),
    Link.configure({
      openOnClick: false,
    }),
    FileHandler.configure({
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
      onPaste: (currentEditor, files) => {
        files.forEach(async (file) => {
          try {
            const src = await processImageFile(file);
            insertImage(currentEditor, src, file.name);
          } catch (error) {
            toast.error((error as Error).message);
          }
        });
      },
      onDrop: (currentEditor, files, pos) => {
        files.forEach(async (file) => {
          try {
            const src = await processImageFile(file);
            currentEditor.chain().focus().insertContentAt(pos, {
              type: 'image',
              attrs: { src, alt: file.name },
            }).run();
          } catch (error) {
            toast.error((error as Error).message);
          }
        });
      },
    }),
  ];

  const editor = useEditor({
    extensions,
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getJSON() as Record<string, unknown>);
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[200px]',
      },
      handleKeyDown: (view, event) => {
        // Handle slash command
        if (event.key === '/' && !showSlashMenu) {
          // Get the editor container's bounding rect
          const editorElement = view.dom;
          const editorRect = editorElement.getBoundingClientRect();

          // Get cursor position relative to viewport
          const { from } = view.state.selection;
          const coords = view.coordsAtPos(from);

          // Calculate position relative to the editor container
          const relativeTop = coords.bottom - editorRect.top;
          const relativeLeft = coords.left - editorRect.left;

          const gap = 4;
          const menuHeight = 320;
          const menuWidth = 256;
          const padding = 8;

          const viewportHeight = window.innerHeight;

          // Check space below and above (using viewport coords for this check)
          const spaceBelow = viewportHeight - coords.bottom - gap - padding;
          const spaceAbove = coords.top - gap - padding;

          let top: number;

          if (spaceBelow >= menuHeight) {
            top = relativeTop + gap;
          } else if (spaceAbove >= menuHeight) {
            top = relativeTop - (coords.bottom - coords.top) - gap - menuHeight;
          } else {
            if (spaceBelow >= spaceAbove) {
              top = relativeTop + gap;
            } else {
              top = Math.max(0, relativeTop - (coords.bottom - coords.top) - gap - menuHeight);
            }
          }

          // Position at the cursor's left position (relative to editor)
          let left = relativeLeft;

          // Ensure menu doesn't overflow the editor width
          const editorWidth = editorRect.width;
          if (left + menuWidth > editorWidth - padding) {
            left = Math.max(0, editorWidth - menuWidth - padding);
          }
          if (left < 0) {
            left = 0;
          }

          setSlashMenuPosition({ top, left });
          setShowSlashMenu(true);
          setSlashFilter('');
          setSelectedIndex(0);
          return false;
        }

        // Handle slash menu navigation
        if (showSlashMenu) {
          if (event.key === 'Escape') {
            setShowSlashMenu(false);
            return true;
          }
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setSelectedIndex((prev) =>
              prev < filteredItems.length - 1 ? prev + 1 : 0
            );
            return true;
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setSelectedIndex((prev) =>
              prev > 0 ? prev - 1 : filteredItems.length - 1
            );
            return true;
          }
          if (event.key === 'Enter') {
            event.preventDefault();
            const item = filteredItems[selectedIndex];
            if (item) {
              executeCommand(item.command);
            }
            return true;
          }
          if (event.key === 'Backspace' && slashFilter === '') {
            setShowSlashMenu(false);
            return false;
          }
          if (event.key.length === 1) {
            setSlashFilter((prev) => prev + event.key);
            setSelectedIndex(0);
          } else if (event.key === 'Backspace') {
            setSlashFilter((prev) => prev.slice(0, -1));
            setSelectedIndex(0);
          }
        }

        return false;
      },
    },
    immediatelyRender: false,
  });

  // Filter slash menu items
  const filteredItems = SLASH_MENU_ITEMS.filter((item) =>
    item.title.toLowerCase().includes(slashFilter.toLowerCase()) ||
    item.command.toLowerCase().includes(slashFilter.toLowerCase())
  );

  // Handle file input change
  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    try {
      const src = await processImageFile(file);
      insertImage(editor, src, file.name);
    } catch (error) {
      toast.error((error as Error).message);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [editor, insertImage]);

  // Execute slash command
  const executeCommand = useCallback(
    (command: string) => {
      if (!editor) return;

      // Delete the slash and filter text
      const { from } = editor.state.selection;
      editor
        .chain()
        .focus()
        .deleteRange({ from: from - 1 - slashFilter.length, to: from })
        .run();

      switch (command) {
        case 'h1':
          editor.chain().focus().toggleHeading({ level: 1 }).run();
          break;
        case 'h2':
          editor.chain().focus().toggleHeading({ level: 2 }).run();
          break;
        case 'h3':
          editor.chain().focus().toggleHeading({ level: 3 }).run();
          break;
        case 'bullet':
          editor.chain().focus().toggleBulletList().run();
          break;
        case 'numbered':
          editor.chain().focus().toggleOrderedList().run();
          break;
        case 'todo':
          editor.chain().focus().toggleTaskList().run();
          break;
        case 'image':
          // Open file picker instead of prompt
          fileInputRef.current?.click();
          break;
      }

      setShowSlashMenu(false);
      setSlashFilter('');
    },
    [editor, slashFilter]
  );

  // Close slash menu when clicking outside
  useEffect(() => {
    const handleClick = () => {
      if (showSlashMenu) {
        setShowSlashMenu(false);
        setSlashFilter('');
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [showSlashMenu]);


  if (!editor) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <Loader2 size={20} className="animate-spin text-[var(--color-text-tertiary)]" />
      </div>
    );
  }

  return (
    <div ref={editorContainerRef} className="relative">
      {/* Hidden file input for image upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
      />

      <EditorContent editor={editor} />

      {/* Slash command menu */}
      {showSlashMenu && filteredItems.length > 0 && (
        <div
          ref={slashMenuRef}
          className="absolute z-50 w-64 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] py-1 shadow-lg overflow-y-auto"
          style={{
            top: slashMenuPosition.top,
            left: slashMenuPosition.left,
            maxHeight: '320px',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {filteredItems.map((item, index) => {
            const IconComponent = {
              h1: Heading1,
              h2: Heading2,
              h3: Heading3,
              bullet: List,
              numbered: ListOrdered,
              todo: CheckSquare,
              image: ImageIcon,
            }[item.command];

            return (
              <button
                key={item.command}
                onClick={() => executeCommand(item.command)}
                className={`flex w-full items-center gap-3 px-3 py-2 text-left ${
                  index === selectedIndex
                    ? 'bg-[var(--color-bg-hover)]'
                    : 'hover:bg-[var(--color-bg-hover)]'
                }`}
              >
                {IconComponent && (
                  <IconComponent className="h-4 w-4 flex-shrink-0 text-[var(--color-text-tertiary)]" />
                )}
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">
                    {item.title}
                  </span>
                  <span className="text-xs text-[var(--color-text-tertiary)]">
                    {item.description}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
