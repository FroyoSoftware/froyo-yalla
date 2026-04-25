-- 2026-04-25
-- Add organizer_name column to activity table

ALTER TABLE activity
ADD COLUMN IF NOT EXISTS organizer_name text;
