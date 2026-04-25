-- 2026-04-23
-- Historical migration (previously executed manually in SQL Editor)
-- Create core schema, RLS policies, and realtime publication for participant_order

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  end_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activity(id) ON DELETE CASCADE,
  name text NOT NULL,
  unit text,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS participant_order (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activity(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  menu_item_id uuid NOT NULL REFERENCES menu_item(id) ON DELETE CASCADE,
  quantity int NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (activity_id, user_id, menu_item_id)
);

ALTER TABLE activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_item ENABLE ROW LEVEL SECURITY;
ALTER TABLE participant_order ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated can view activities" ON activity;
CREATE POLICY "authenticated can view activities"
ON activity FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "authenticated can view menu items" ON menu_item;
CREATE POLICY "authenticated can view menu items"
ON menu_item FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "users can select own orders" ON participant_order;
CREATE POLICY "users can select own orders"
ON participant_order FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users can insert own orders" ON participant_order;
CREATE POLICY "users can insert own orders"
ON participant_order FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users can update own orders" ON participant_order;
CREATE POLICY "users can update own orders"
ON participant_order FOR UPDATE USING (auth.uid() = user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'participant_order'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE participant_order;
  END IF;
END $$;
