-- 2026-04-23
-- Historical migration (previously executed manually in SQL Editor)
-- Grant table privileges for core ordering tables

GRANT ALL ON TABLE activity TO anon, authenticated, service_role;
GRANT ALL ON TABLE menu_item TO anon, authenticated, service_role;
GRANT ALL ON TABLE participant_order TO anon, authenticated, service_role;
