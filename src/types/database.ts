// Database types matching our Supabase schema

export type Priority = 'none' | 'low' | 'medium' | 'high';
export type Theme = 'light' | 'dark' | 'system';

export interface Page {
  id: string;
  user_id: string;
  parent_id: string | null;
  title: string;
  icon: string | null;
  position: number;
  is_deleted: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Column {
  id: string;
  page_id: string;
  title: string;
  color: string;
  icon: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  page_id: string;
  column_id: string;
  user_id: string;
  title: string;
  content: Record<string, unknown> | null; // Tiptap JSON
  priority: Priority;
  due_date: string | null;
  assignee_id: string | null;
  assignee: string | null; // Simple name-based assignee
  position: number;
  is_deleted: boolean;
  deleted_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  id: string;
  user_id: string;
  theme: Theme;
  sidebar_collapsed: boolean;
  sidebar_expanded_pages: string[];
  auto_archive_days: number | null;
  created_at: string;
  updated_at: string;
}

// Extended types with relations
export interface PageWithChildren extends Page {
  children?: PageWithChildren[];
}

export interface ColumnWithTasks extends Column {
  tasks: Task[];
}

// Insert types (without auto-generated fields)
export interface PageInsert {
  user_id: string;
  parent_id?: string | null;
  title: string;
  icon?: string | null;
  position?: number;
}

export interface ColumnInsert {
  page_id: string;
  title: string;
  color?: string;
  icon?: string | null;
  position?: number;
}

export interface TaskInsert {
  page_id: string;
  column_id: string;
  user_id: string;
  title: string;
  content?: Record<string, unknown> | null;
  priority?: Priority;
  due_date?: string | null;
  position?: number;
}

// Update types (all fields optional except id)
export interface PageUpdate {
  id: string;
  parent_id?: string | null;
  title?: string;
  icon?: string | null;
  position?: number;
  is_deleted?: boolean;
  deleted_at?: string | null;
}

export interface ColumnUpdate {
  id: string;
  title?: string;
  color?: string;
  icon?: string | null;
  position?: number;
}

export interface TaskUpdate {
  id: string;
  column_id?: string;
  title?: string;
  content?: Record<string, unknown> | null;
  priority?: Priority;
  due_date?: string | null;
  assignee?: string | null;
  position?: number;
  is_deleted?: boolean;
  deleted_at?: string | null;
  completed_at?: string | null;
}
