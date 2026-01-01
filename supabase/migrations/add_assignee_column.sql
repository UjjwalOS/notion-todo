-- Migration: Add assignee column to tasks table
-- This adds a simple text-based assignee field (not tied to auth.users)

-- Add the assignee column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tasks' AND column_name = 'assignee'
    ) THEN
        ALTER TABLE tasks ADD COLUMN assignee TEXT;
    END IF;
END $$;
