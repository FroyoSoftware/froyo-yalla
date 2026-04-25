-- 2026-04-25
-- Add menu item note column and participant special note table

ALTER TABLE menu_item
ADD COLUMN IF NOT EXISTS note text;

CREATE TABLE IF NOT EXISTS participant_note (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activity(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note text CHECK (char_length(note) <= 300),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (activity_id, user_id)
);

ALTER TABLE participant_note ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users can select own note" ON participant_note;
DROP POLICY IF EXISTS "users can upsert own note" ON participant_note;
DROP POLICY IF EXISTS "users can update own note" ON participant_note;
DROP POLICY IF EXISTS "users can delete own note" ON participant_note;
DROP POLICY IF EXISTS "users can manage own notes" ON participant_note;
CREATE POLICY "users can manage own notes"
  ON participant_note FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

GRANT ALL ON TABLE participant_note TO anon, authenticated, service_role;
