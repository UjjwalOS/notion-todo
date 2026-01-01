import { useCallback, useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import { Loader2 } from 'lucide-react';

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
  { title: 'Image', command: 'image', description: 'Insert an image' },
];

// Memoize extensions to prevent recreation on every render
const extensions = [
  StarterKit.configure({
    heading: {
      levels: [1, 2, 3],
    },
  }),
  Placeholder.configure({
    placeholder: 'Type "/" for commands...',
  }),
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  Image.configure({
    HTMLAttributes: {
      class: 'rounded-md max-w-full',
    },
  }),
  Link.configure({
    openOnClick: false,
  }),
];

export function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashMenuPosition, setSlashMenuPosition] = useState({ top: 0, left: 0 });
  const [slashFilter, setSlashFilter] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Capture content on mount only - we intentionally skip updates to prevent editor resets
  const [initialContent] = useState(() => content || {
    type: 'doc',
    content: [{ type: 'paragraph' }],
  });

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
          const { from } = view.state.selection;
          const coords = view.coordsAtPos(from);
          setSlashMenuPosition({
            top: coords.bottom + 8,
            left: coords.left,
          });
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
        case 'image': {
          const url = prompt('Enter image URL:');
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
          break;
        }
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
    <div className="relative">
      <EditorContent editor={editor} />

      {/* Slash command menu */}
      {showSlashMenu && filteredItems.length > 0 && (
        <div
          className="fixed z-50 w-64 rounded-md border border-[var(--color-border)] bg-[var(--color-bg-primary)] py-1 shadow-lg"
          style={{
            top: slashMenuPosition.top,
            left: slashMenuPosition.left,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {filteredItems.map((item, index) => (
            <button
              key={item.command}
              onClick={() => executeCommand(item.command)}
              className={`flex w-full flex-col px-3 py-2 text-left ${
                index === selectedIndex
                  ? 'bg-[var(--color-bg-hover)]'
                  : 'hover:bg-[var(--color-bg-hover)]'
              }`}
            >
              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                {item.title}
              </span>
              <span className="text-xs text-[var(--color-text-tertiary)]">
                {item.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
