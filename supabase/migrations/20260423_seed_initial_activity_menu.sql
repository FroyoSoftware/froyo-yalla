-- 2026-04-23
-- Historical migration (previously executed manually in SQL Editor)
-- Seed initial activity and menu items from early setup phase

WITH existing_activity AS (
  SELECT id
  FROM activity
  WHERE title = '炭火小烧烤 4.26 11:30AM'
    AND end_at = '2026-04-24 12:00:00+08'::timestamptz
  LIMIT 1
),
new_activity AS (
  INSERT INTO activity (title, end_at)
  SELECT '炭火小烧烤 4.26 11:30AM', '2026-04-24 12:00:00+08'::timestamptz
  WHERE NOT EXISTS (SELECT 1 FROM existing_activity)
  RETURNING id
),
target_activity AS (
  SELECT id FROM existing_activity
  UNION ALL
  SELECT id FROM new_activity
),
items(sort_order, name, unit) AS (
  VALUES
    (1,  '羊肉串',   '串'),
    (2,  '牛肉串',   '串'),
    (3,  '鸡翅膀',   '串'),
    (4,  '烤肠',     '串'),
    (5,  '亲亲肠',   '串'),
    (6,  '包浆豆腐', '颗'),
    (7,  '茄子',     '份'),
    (8,  '囊',       '份'),
    (9,  '玉米',     '根'),
    (10, '红薯',     '个')
)
INSERT INTO menu_item (activity_id, name, unit, sort_order)
SELECT
  ta.id,
  i.name,
  i.unit,
  i.sort_order
FROM target_activity ta
CROSS JOIN items i
WHERE NOT EXISTS (
  SELECT 1
  FROM menu_item mi
  WHERE mi.activity_id = ta.id
    AND mi.name = i.name
    AND COALESCE(mi.unit, '') = COALESCE(i.unit, '')
    AND mi.sort_order = i.sort_order
);
