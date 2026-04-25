-- 2026-04-24
-- Historical migration (previously executed manually in SQL Editor)

ALTER TABLE menu_item
ADD COLUMN IF NOT EXISTS note text;

CREATE TABLE IF NOT EXISTS participant_note (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activity(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note text NOT NULL CHECK (char_length(note) <= 300),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (activity_id, user_id)
);

ALTER TABLE participant_note ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users can select own note"
ON participant_note FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users can upsert own note"
ON participant_note FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users can update own note"
ON participant_note FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "users can delete own note"
ON participant_note FOR DELETE USING (auth.uid() = user_id);

GRANT ALL ON TABLE participant_note TO anon, authenticated, service_role;
