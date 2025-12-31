# Notion Type - To Do App Specification

## Overview

A Kanban-focused task management application with Notion-like rich text editing capabilities. The app provides a clean, motion-inspired interface centered around customizable Kanban boards with an infinitely nestable page hierarchy and a powerful command palette.

---

## Core Concepts

### Application Structure

- **Workspace**: Single-user workspace containing all pages and tasks
- **Pages**: Nestable containers that hold Kanban boards (infinite nesting supported)
- **Columns**: Customizable status columns within each Kanban board (per-page)
- **Tasks**: Individual items with rich text content and structured metadata
- **My Tasks Hub**: Aggregate dashboard showing tasks across all pages

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Vite + React |
| Styling | TailwindCSS |
| Rich Text Editor | Tiptap |
| Backend/Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth (email/password) |
| File Storage | Supabase Storage |
| State Management | TBD (React Context or Zustand) |
| Drag & Drop | TBD (dnd-kit or react-beautiful-dnd) |

---

## Data Model

### Database Schema

```sql
-- Users (managed by Supabase Auth)

-- Pages
pages
  - id: uuid (PK)
  - user_id: uuid (FK to auth.users)
  - parent_id: uuid (FK to pages, nullable for root pages)
  - title: text
  - icon: text (emoji, nullable)
  - position: integer (for ordering siblings)
  - is_deleted: boolean (soft delete)
  - deleted_at: timestamp (nullable)
  - created_at: timestamp
  - updated_at: timestamp

-- Columns (per-page Kanban columns)
columns
  - id: uuid (PK)
  - page_id: uuid (FK to pages)
  - title: text
  - color: text (hex color)
  - icon: text (emoji, nullable)
  - position: integer (for ordering)
  - created_at: timestamp
  - updated_at: timestamp

-- Tasks
tasks
  - id: uuid (PK)
  - page_id: uuid (FK to pages)
  - column_id: uuid (FK to columns)
  - user_id: uuid (FK to auth.users)
  - title: text
  - content: jsonb (Tiptap document JSON)
  - priority: enum ('none', 'low', 'medium', 'high')
  - due_date: timestamp (nullable)
  - assignee_id: uuid (FK to auth.users, nullable, hidden in UI for now)
  - position: integer (for ordering within column)
  - is_deleted: boolean (soft delete)
  - deleted_at: timestamp (nullable)
  - completed_at: timestamp (nullable)
  - created_at: timestamp
  - updated_at: timestamp

-- User Settings
user_settings
  - id: uuid (PK)
  - user_id: uuid (FK to auth.users)
  - theme: enum ('light', 'dark', 'system')
  - sidebar_collapsed: boolean
  - sidebar_expanded_pages: jsonb (array of page IDs)
  - auto_archive_days: integer (nullable, days after completion)
  - created_at: timestamp
  - updated_at: timestamp
```

### Soft Delete & Trash

- Pages and tasks use soft delete (`is_deleted` flag + `deleted_at` timestamp)
- Trash is recoverable for 30 days
- Deleting a page soft-deletes all nested pages and tasks within (cascade)
- Permanent deletion after 30 days via scheduled job or manual empty trash

---

## Features

### 1. Sidebar Navigation

#### Structure
- Collapsible/expandable tree of pages
- Infinite nesting (pages within pages)
- Hamburger menu to fully hide sidebar
- Search input at top (opens command palette)

#### Behaviors
- Drag pages to reorder within same level
- Drag pages into other pages to nest
- Right-click context menu: Rename, Duplicate, Delete, Add subpage
- Expansion state persisted in localStorage
- Full collapse state persisted

#### Visual Elements
- Page icon (emoji) + title
- Expand/collapse chevron for pages with children
- "Add page" button (+ icon)
- Trash section at bottom

---

### 2. Kanban Board (Default View)

#### Columns
- Per-page customizable columns
- Default columns for new pages: "Inbox", "In Progress", "Done"
- Each column has: title, color (from preset palette), optional emoji icon
- No limit on number of columns (horizontal scroll when needed)
- Empty columns always visible with "No tasks" placeholder
- Add column button at end

#### Task Cards
- Display: Title + content preview (first line/image thumbnail)
- Metadata shown only if set (due date text, priority badge hidden if "none")
- Overdue tasks: due date text turns red
- Drag to reorder within column
- Drag between columns on same page
- Drag to sidebar pages to move to different page

#### Task Creation
- "+" button at top of each column
- Keyboard shortcut: `Cmd/Ctrl + N` (adds to first column or opens picker)
- New tasks appear at TOP of column
- Inline title editing, Enter to save and open modal

#### Column Management
- Click column header to edit: title, color, emoji
- Drag column headers to reorder
- Delete column (prompt to move or delete contained tasks)

---

### 3. List View (Alternative)

#### Toggle
- View toggle button in page header (Kanban | List icons)
- Same underlying data, different presentation

#### Table Structure
- Columns: Title, Status (column name), Due Date
- Minimal 3-column view
- Click row to open task modal

#### Grouping
- Flexible grouping options: None, By Status, By Priority, By Due Date
- Default: Group by Status (mirrors Kanban structure)
- Collapsible group headers

#### Sorting
- Click column headers to sort
- Sort by: Title (A-Z), Status, Due Date, Priority, Created Date

---

### 4. Task Modal

#### Layout
- Full-page modal overlay
- Two sections: Main content area (left) + Metadata side panel (right)
- Side panel toggle button in top-right (next to close button)
- When side panel closed, content area expands to full width

#### Header
- Task title (editable, large text)
- Close button (X)
- Side panel toggle button

#### Main Content Area (Tiptap Editor)
- Block-based rich text editing
- Supported blocks:
  - Paragraphs
  - Headings (H1, H2, H3)
  - Bullet lists
  - Numbered lists
  - Checkbox lists (to-do items)
  - Images (uploaded to Supabase Storage)
  - File embeds
  - Link previews

#### Slash Commands (Simplified)
- Type `/` to open command menu
- Available commands:
  - `/h1`, `/h2`, `/h3` - Headings
  - `/bullet` - Bullet list
  - `/numbered` - Numbered list
  - `/todo` - Checkbox list
  - `/image` - Insert image
- Filtered as user types

#### Metadata Side Panel
- Due date picker (calendar widget)
- Priority selector (None / Low / Medium / High)
- Status selector (dropdown of page columns)
- Assignee field (hidden in UI, schema ready for future)
- Created date (read-only)
- Completed date (read-only, shown when done)

#### Smart Defaults (Column Automations)
- Moving task to a column named "Done"/"Completed"/"Complete": auto-set `completed_at`
- Moving task OUT of done column: clear `completed_at`
- Additional automations can be added later

#### Checkbox Completion Prompt
- When all checkboxes in task body are checked
- Show prompt: "All items complete. Move to Done?"
- Options: "Move to Done" / "Keep Here"

---

### 5. Command Palette (Cmd+K)

#### Trigger
- Keyboard shortcut: `Cmd/Ctrl + K`
- Click search input in sidebar

#### Search Scope
- Pages (by title)
- Tasks (by title)
- Fuzzy matching

#### Results Display
- Grouped by type (Pages, Tasks)
- Page results show path breadcrumb
- Task results show parent page name
- Keyboard navigation (arrow keys + Enter)

#### Actions
- Select page: navigate to it
- Select task: open task modal

---

### 6. My Tasks Hub

#### Location
- Special section at top of sidebar (above pages)
- Always visible, not deletable

#### Sections
- **Today**: Tasks due today
- **Overdue**: Tasks past due date (sorted oldest first)
- **Upcoming**: Tasks due in next 7 days (sorted by due date)
- **No Due Date**: Tasks without due dates (optional, collapsible)

#### Behavior
- Aggregates tasks from ALL pages
- Click task to open modal (shows which page it's from)
- Can drag tasks to sidebar pages to reassign

---

### 7. Notifications

#### Browser Notifications
- Request permission on first due date set
- Notify when task becomes due
- Notify for overdue tasks (once per task)

#### Visual Indicators
- Overdue: Red due date text on card
- Due today: Visible but not alarming
- No intrusive in-app banners

---

### 8. Archive & Trash

#### Auto-Archive
- User setting: auto-archive tasks completed more than X days ago
- Archived tasks hidden from Kanban but exist in database
- Can view/restore from archive

#### Trash
- Soft-deleted pages and tasks
- 30-day retention
- Accessible from sidebar bottom
- Can restore or permanently delete
- Empty trash action

---

### 9. Settings

#### Theme
- Light mode
- Dark mode
- System preference (default)
- Toggle accessible from settings or keyboard shortcut

#### Preferences
- Auto-archive after X days (0 = disabled)
- Default new task column (first column)
- Notification preferences

#### Account
- Email display
- Logout button
- Export data (JSON)

---

## UI/UX Specifications

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Open command palette |
| `Cmd/Ctrl + N` | New task |
| `Cmd/Ctrl + Z` | Undo last action |
| `Cmd/Ctrl + Shift + Z` | Redo |
| `Escape` | Close modal/palette |
| `Tab` | Navigate between cards |
| `Enter` | Open focused card |
| `Cmd/Ctrl + \` | Toggle sidebar |
| `Cmd/Ctrl + Shift + L` | Toggle theme |

### Undo/Redo System

- Full action undo (not just text editing)
- Supported actions:
  - Task moves (between columns, between pages)
  - Task edits (title, content, metadata)
  - Task deletion
  - Column changes
  - Page moves/edits
- Undo stack persisted in memory (cleared on page refresh)
- `Cmd/Ctrl + Z` anywhere triggers undo

### Breadcrumbs

- Shown at top of Kanban board
- Full path: Home > Parent > Parent > Current Page
- Collapsible: Home > ... > Current Page (when too long)
- Each segment clickable for navigation

### Drag and Drop

#### Desktop
- Full mouse drag support
- Visual drop indicators
- Smooth animations

#### Mobile/Tablet
- Touch drag for reordering within column
- Swipe gestures for moving between adjacent columns
- Long-press to initiate drag

### Responsive Design

- Desktop: Full sidebar + Kanban board
- Tablet: Collapsible sidebar overlay
- Mobile: Bottom navigation or hamburger menu

### Loading States

- Skeleton loaders for initial page load
- Optimistic updates for task operations
- Subtle spinners for async operations

### Empty States

- New workspace: Welcome message + "Create your first page" CTA
- Empty page: "Add your first column" prompt
- Empty column: "No tasks" text (subtle)
- Empty search: "No results found"

---

## Onboarding

### First Login
- Sample project page created automatically
- Contains:
  - 3 default columns (Inbox, In Progress, Done)
  - 3-4 sample tasks demonstrating features
  - One task with rich content (checkboxes, heading)
- Dismissable welcome tooltip tour (optional, can implement later)

---

## Data Sync & Persistence

### Sync Strategy
- Periodic polling (every 30 seconds) for multi-tab consistency
- NOT real-time subscriptions (simpler implementation)
- Optimistic UI updates for immediate feedback
- Conflict resolution: last-write-wins

### Local Storage
- Theme preference
- Sidebar collapse state
- Expanded page IDs
- Last viewed page

### Export
- JSON export of all user data
- Includes: pages, columns, tasks, settings
- Downloadable file

---

## Security Considerations

### Row Level Security (RLS)
- All tables protected by Supabase RLS
- Users can only access their own data
- Policies: SELECT, INSERT, UPDATE, DELETE restricted to `auth.uid() = user_id`

### Input Validation
- Sanitize all user inputs
- Validate Tiptap JSON structure
- File upload restrictions (type, size)

### Authentication
- Email/password only (initially)
- Session management via Supabase
- Secure token storage

---

## Future Considerations (Out of Scope for V1)

These features are explicitly NOT in V1 but the architecture should not prevent them:

- [ ] Custom fields (text, date, select properties)
- [ ] Tags/labels system
- [ ] Multi-user collaboration
- [ ] Real-time sync (Supabase subscriptions)
- [ ] Calendar view
- [ ] Recurring tasks
- [ ] API integrations (Gmail, Slack)
- [ ] Mobile native apps
- [ ] Offline support (service worker)
- [ ] Import from Notion/Trello
- [ ] Webhooks
- [ ] Activity log / audit trail

---

## Implementation Phases

### Phase 1: Foundation
- Project setup (Vite + React + Tailwind)
- Supabase project creation and schema
- Authentication flow (login, logout, session)
- Basic routing structure

### Phase 2: Core Data Layer
- Database tables and RLS policies
- React hooks for CRUD operations (`useTasks`, `usePages`, `useColumns`)
- Supabase client configuration

### Phase 3: Sidebar & Navigation
- Page tree component
- Create/rename/delete pages
- Drag-to-reorder pages
- Collapse/expand functionality
- Sidebar hide/show

### Phase 4: Kanban Board
- Column rendering
- Task card components
- Drag-and-drop (within column, between columns)
- Column management (add, edit, delete, reorder)

### Phase 5: Task Modal
- Modal overlay component
- Tiptap editor integration
- Metadata side panel
- Slash commands

### Phase 6: List View
- Table component
- View toggle
- Grouping and sorting

### Phase 7: Command Palette
- Modal component
- Search implementation
- Keyboard navigation

### Phase 8: My Tasks Hub
- Aggregate query
- Section components
- Navigation integration

### Phase 9: Polish
- Undo/redo system
- Keyboard shortcuts
- Dark mode
- Notifications
- Settings page
- Export functionality

### Phase 10: Onboarding & Launch
- Sample data generation
- Empty states
- Error handling
- Performance optimization
- Testing

---

## Open Questions / Decisions Deferred

1. **State Management**: React Context vs Zustand vs Jotai - decide during implementation
2. **Drag-and-Drop Library**: dnd-kit vs react-beautiful-dnd - evaluate during Phase 4
3. **Date Picker Component**: Existing library vs custom - evaluate options
4. **Animation Library**: Framer Motion vs CSS transitions - based on complexity needs
5. **Form Handling**: React Hook Form vs native - based on complexity

---

## Success Metrics

- App loads in < 2 seconds
- Task operations feel instant (< 100ms perceived)
- Zero data loss
- Works across Chrome, Firefox, Safari, Edge
- Accessible (keyboard navigation, screen reader basics)

---

*Document Version: 1.0*
*Last Updated: December 2024*
