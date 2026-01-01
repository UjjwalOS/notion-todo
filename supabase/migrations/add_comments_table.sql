-- Comments table for task comments
-- Run this in your Supabase SQL Editor

-- ==============================================
-- COMMENTS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    mentions UUID[] DEFAULT '{}',
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================
-- INDEXES
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_comments_task_id ON comments(task_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_is_deleted ON comments(is_deleted);

-- ==============================================
-- TRIGGER FOR updated_at
-- ==============================================

DROP TRIGGER IF EXISTS update_comments_updated_at ON comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Users can view comments on their own tasks
DROP POLICY IF EXISTS "Users can view comments on their tasks" ON comments;
CREATE POLICY "Users can view comments on their tasks" ON comments
    FOR SELECT USING (
        user_id = auth.uid() OR
        task_id IN (SELECT id FROM tasks WHERE user_id = auth.uid())
    );

-- Users can create comments on their own tasks
DROP POLICY IF EXISTS "Users can create comments" ON comments;
CREATE POLICY "Users can create comments" ON comments
    FOR INSERT WITH CHECK (
        auth.uid() = user_id AND
        task_id IN (SELECT id FROM tasks WHERE user_id = auth.uid())
    );

-- Users can update their own comments
DROP POLICY IF EXISTS "Users can update their own comments" ON comments;
CREATE POLICY "Users can update their own comments" ON comments
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own comments
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;
CREATE POLICY "Users can delete their own comments" ON comments
    FOR DELETE USING (auth.uid() = user_id);

-- ==============================================
-- STORAGE BUCKET FOR COMMENT IMAGES
-- ==============================================

-- Note: Run these in the Supabase Dashboard under Storage > Policies
-- Or use the Supabase CLI

-- Create the bucket (if using SQL Editor, you may need to do this in Dashboard)
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('comment-images', 'comment-images', true)
-- ON CONFLICT (id) DO NOTHING;

-- Storage policies need to be created in the Dashboard:
-- 1. Go to Storage > comment-images bucket > Policies
-- 2. Add INSERT policy: ((bucket_id = 'comment-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))
-- 3. Add SELECT policy: (bucket_id = 'comment-images'::text) -- Allow public read
-- 4. Add DELETE policy: ((bucket_id = 'comment-images'::text) AND ((auth.uid())::text = (storage.foldername(name))[1]))
