-- Notion Todo Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- TABLES
-- ==============================================

-- Pages table (infinite nesting supported via parent_id)
CREATE TABLE IF NOT EXISTS pages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES pages(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled',
    icon TEXT, -- emoji icon
    position INTEGER NOT NULL DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Columns table (Kanban columns, per-page)
CREATE TABLE IF NOT EXISTS columns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT '#e3e2e0',
    icon TEXT, -- emoji icon
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    page_id UUID NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
    column_id UUID NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '',
    content JSONB, -- Tiptap document JSON
    priority TEXT NOT NULL DEFAULT 'none' CHECK (priority IN ('none', 'low', 'medium', 'high')),
    due_date TIMESTAMPTZ,
    assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    position INTEGER NOT NULL DEFAULT 0,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    sidebar_collapsed BOOLEAN NOT NULL DEFAULT FALSE,
    sidebar_expanded_pages JSONB NOT NULL DEFAULT '[]'::jsonb,
    auto_archive_days INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================
-- INDEXES
-- ==============================================

-- Pages indexes
CREATE INDEX IF NOT EXISTS idx_pages_user_id ON pages(user_id);
CREATE INDEX IF NOT EXISTS idx_pages_parent_id ON pages(parent_id);
CREATE INDEX IF NOT EXISTS idx_pages_is_deleted ON pages(is_deleted);

-- Columns indexes
CREATE INDEX IF NOT EXISTS idx_columns_page_id ON columns(page_id);

-- Tasks indexes
CREATE INDEX IF NOT EXISTS idx_tasks_page_id ON tasks(page_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column_id ON tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_is_deleted ON tasks(is_deleted);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- ==============================================
-- TRIGGERS FOR updated_at
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_pages_updated_at ON pages;
CREATE TRIGGER update_pages_updated_at
    BEFORE UPDATE ON pages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_columns_updated_at ON columns;
CREATE TRIGGER update_columns_updated_at
    BEFORE UPDATE ON columns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tasks_updated_at ON tasks;
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Pages policies
DROP POLICY IF EXISTS "Users can view their own pages" ON pages;
CREATE POLICY "Users can view their own pages" ON pages
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own pages" ON pages;
CREATE POLICY "Users can insert their own pages" ON pages
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own pages" ON pages;
CREATE POLICY "Users can update their own pages" ON pages
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own pages" ON pages;
CREATE POLICY "Users can delete their own pages" ON pages
    FOR DELETE USING (auth.uid() = user_id);

-- Columns policies (access through page ownership)
DROP POLICY IF EXISTS "Users can view columns of their pages" ON columns;
CREATE POLICY "Users can view columns of their pages" ON columns
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM pages WHERE pages.id = columns.page_id AND pages.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can insert columns to their pages" ON columns;
CREATE POLICY "Users can insert columns to their pages" ON columns
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM pages WHERE pages.id = columns.page_id AND pages.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can update columns of their pages" ON columns;
CREATE POLICY "Users can update columns of their pages" ON columns
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM pages WHERE pages.id = columns.page_id AND pages.user_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can delete columns of their pages" ON columns;
CREATE POLICY "Users can delete columns of their pages" ON columns
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM pages WHERE pages.id = columns.page_id AND pages.user_id = auth.uid())
    );

-- Tasks policies
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
CREATE POLICY "Users can view their own tasks" ON tasks
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own tasks" ON tasks;
CREATE POLICY "Users can insert their own tasks" ON tasks
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
CREATE POLICY "Users can update their own tasks" ON tasks
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;
CREATE POLICY "Users can delete their own tasks" ON tasks
    FOR DELETE USING (auth.uid() = user_id);

-- User settings policies
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
CREATE POLICY "Users can view their own settings" ON user_settings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
CREATE POLICY "Users can insert their own settings" ON user_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
CREATE POLICY "Users can update their own settings" ON user_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- ==============================================
-- FUNCTION: Create default settings for new users
-- ==============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create settings when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- ==============================================
-- FUNCTION: Create sample data for new users
-- ==============================================

CREATE OR REPLACE FUNCTION create_sample_data_for_user(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_page_id UUID;
    v_inbox_column_id UUID;
    v_progress_column_id UUID;
    v_done_column_id UUID;
BEGIN
    -- Create a sample page
    INSERT INTO pages (user_id, title, icon, position)
    VALUES (p_user_id, 'Getting Started', '🚀', 0)
    RETURNING id INTO v_page_id;

    -- Create default columns
    INSERT INTO columns (page_id, title, color, position)
    VALUES (v_page_id, 'Inbox', '#e3e2e0', 0)
    RETURNING id INTO v_inbox_column_id;

    INSERT INTO columns (page_id, title, color, position)
    VALUES (v_page_id, 'In Progress', '#f5a623', 1)
    RETURNING id INTO v_progress_column_id;

    INSERT INTO columns (page_id, title, color, position)
    VALUES (v_page_id, 'Done', '#4caf50', 2)
    RETURNING id INTO v_done_column_id;

    -- Create sample tasks
    INSERT INTO tasks (page_id, column_id, user_id, title, content, priority, position)
    VALUES (
        v_page_id,
        v_inbox_column_id,
        p_user_id,
        'Welcome to Notion Todo!',
        '{"type":"doc","content":[{"type":"paragraph","content":[{"type":"text","text":"This is your first task. Click on it to edit the content."}]},{"type":"paragraph","content":[{"type":"text","text":"You can:"}]},{"type":"bulletList","content":[{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Drag tasks between columns"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Create new tasks with the + button"}]}]},{"type":"listItem","content":[{"type":"paragraph","content":[{"type":"text","text":"Add rich text, checkboxes, and images"}]}]}]}]}'::jsonb,
        'none',
        0
    );

    INSERT INTO tasks (page_id, column_id, user_id, title, priority, due_date, position)
    VALUES (
        v_page_id,
        v_inbox_column_id,
        p_user_id,
        'Try setting a due date',
        'medium',
        NOW() + INTERVAL '3 days',
        1
    );

    INSERT INTO tasks (page_id, column_id, user_id, title, priority, position)
    VALUES (
        v_page_id,
        v_progress_column_id,
        p_user_id,
        'Explore the sidebar',
        'low',
        0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: Call create_sample_data_for_user(user_id) manually after first signup
-- or modify handle_new_user() to call it automatically
