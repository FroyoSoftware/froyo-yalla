import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// load .env.local manually
const envFile = readFileSync(resolve(process.cwd(), '.env.local'), 'utf-8')
for (const line of envFile.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/)
  if (match) process.env[match[1].trim()] = match[2].trim()
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function parseDeadline(raw: string | null): string {
  if (!raw) return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  // Supports patterns like: 2026-4-24 Noon or 2026-4-24 12:00
  const noonMatch = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})\s+(?:Noon|12:00)$/i)
  if (noonMatch) {
    const [, y, m, d] = noonMatch
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T12:00:00+08:00`
  }

  // YYYY-M-D or YYYY-MM-DD (date only, no time) → end of day
  const dateOnly = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
  if (dateOnly) {
    const [, y, m, d] = dateOnly
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}T23:59:00+08:00`
  }

  const parsed = new Date(raw)
  if (!Number.isNaN(parsed.getTime())) return parsed.toISOString()

  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
}

function readMenuConfig() {
  const menuRaw = readFileSync(resolve(process.cwd(), 'menu.md'), 'utf-8')
  const lines = menuRaw.split('\n')

  const title =
    menuRaw.match(/^-[ \t]*活动名称[：:][ \t]*(.+)$/m)?.[1]?.trim() ||
    'Yalla Group Order'

  const descFromHeader =
    menuRaw.match(/^-[ \t]*活动描述[：:][ \t]*(.*)$/m)?.[1]?.trim() || ''

  const organizerName =
    menuRaw.match(/^-[ \t]*发起人[：:][ \t]*(.+)$/m)?.[1]?.trim() || null

  const deadlineRaw =
    menuRaw.match(/^-[ \t]*截止时间[：:][ \t]*(.+)$/m)?.[1]?.trim() || null

  const markerIndex = lines.findIndex((l) => l.includes('在这里填你的菜单'))
  const menuZone = markerIndex >= 0 ? lines.slice(markerIndex + 1) : lines

  const menuItems: Array<{ name: string; unit: string; note: string | null; sort_order: number }> = []
  const extras: string[] = []

  for (const rawLine of menuZone) {
    const line = rawLine.trim()
    if (!line) continue

    if (line.startsWith('//')) {
      const extra = line.replace(/^\/\//, '').trim()
      if (extra) extras.push(extra)
      continue
    }

    const itemMatch = line.match(/^(.+?)\s*[,，]\s*([^\s(（]+)\s*(?:[（(]([^()（）]+)[）)])?\s*$/)
    if (!itemMatch) continue

    const [, nameRaw, unitRaw, noteRaw] = itemMatch
    menuItems.push({
      name: nameRaw.trim(),
      unit: unitRaw.trim(),
      note: noteRaw?.trim() || null,
      sort_order: menuItems.length + 1,
    })
  }

  const description =
    descFromHeader || (extras.length > 0 ? `另：${extras.join('，')}` : null)

  return {
    activity: {
      title,
      description,
      organizer_name: organizerName,
      end_at: parseDeadline(deadlineRaw),
    },
    menuItems,
  }
}

// Fixed activity ID — always upsert to this record, never create a new one
const ACTIVITY_ID = '89a1d39f-2c78-49e3-ae87-0f6ccd180e55'

async function seed() {
  const { activity, menuItems } = readMenuConfig()

  console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
  console.log('Using service role key from environment')

  if (menuItems.length === 0) {
    console.error('menu.md 中没有解析到菜单项，请检查格式：菜名, 单位 (备注)')
    process.exit(1)
  }

  // Always update the fixed activity — title changes propagate correctly
  const { error: updateErr } = await supabase
    .from('activity')
    .update({
      title: activity.title,
      description: activity.description,
      organizer_name: activity.organizer_name,
      end_at: activity.end_at,
    })
    .eq('id', ACTIVITY_ID)
  if (updateErr) { console.error('更新 activity 失败:', updateErr.message); process.exit(1) }
  const actId = ACTIVITY_ID
  console.log(`✅ activity 已更新: ${activity.title}`)

  console.log(`   id: ${actId}`)

  // Upsert menu items — add new ones, update existing by name
  for (const item of menuItems) {
    const { data: existingItem } = await supabase
      .from('menu_item')
      .select('id')
      .eq('activity_id', actId)
      .eq('name', item.name)
      .maybeSingle()

    if (existingItem) {
      await supabase
        .from('menu_item')
        .update({ unit: item.unit, note: item.note, sort_order: item.sort_order })
        .eq('id', existingItem.id)
    } else {
      await supabase
        .from('menu_item')
        .insert({ ...item, activity_id: actId })
    }
  }

  console.log(`✅ ${menuItems.length} 个菜单项已同步`)
  console.log(`\n参与者填写页: /activity/${ACTIVITY_ID}`)
  console.log(`管理员汇总页: /activity/${ACTIVITY_ID}/admin`)
}

seed()
