'use server'

import { createClient, createAdminClient } from '@/lib/supabase'
import { normalizeEmail } from '@/lib/utils'
import { headers, cookies } from 'next/headers'
import { redirect } from 'next/navigation'

// ─── Auth ────────────────────────────────────────────────────────────────────

export async function signInWithGoogle(returnTo: string = '/') {
  const supabase = await createClient()
  const headersList = await headers()
  const host = headersList.get('host') ?? 'localhost:3000'
  const protocol = host.startsWith('localhost') ? 'http' : 'https'
  const origin = `${protocol}://${host}`

  const safeReturnTo = returnTo.startsWith('/') ? returnTo : '/'

  // Store returnTo in a cookie — query params can be dropped by Supabase OAuth
  const cookieStore = await cookies()
  cookieStore.set('auth_return_to', safeReturnTo, {
    path: '/',
    maxAge: 300,
    httpOnly: true,
    sameSite: 'lax',
    secure: !host.startsWith('localhost'),
  })

  const callbackUrl = `${origin}/auth/callback`

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
    },
  })

  if (error || !data.url) {
    throw new Error(error?.message ?? 'OAuth failed')
  }

  redirect(data.url)
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

// ─── Activity ─────────────────────────────────────────────────────────────────

export async function getActivityWithMenu(activityId: string) {
  const supabase = await createClient()

  const { data: activity, error: actErr } = await supabase
    .from('activity')
    .select('id, title, description, organizer_name, end_at')
    .eq('id', activityId)
    .single()

  if (actErr || !activity) return null

  const { data: menuItems } = await supabase
    .from('menu_item')
    .select('id, name, unit, note, sort_order')
    .eq('activity_id', activityId)
    .order('sort_order')

  return { activity, menuItems: menuItems ?? [] }
}

export async function getMyOrders(activityId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data } = await supabase
    .from('participant_order')
    .select('menu_item_id, quantity')
    .eq('activity_id', activityId)
    .eq('user_id', user.id)

  return data ?? []
}

export async function getMySpecialNote(activityId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return ''

  const { data, error } = await supabase
    .from('participant_note')
    .select('note')
    .eq('activity_id', activityId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error) {
    if (error.message.includes("Could not find the table 'public.participant_note'")) {
      return ''
    }
    throw new Error(error.message)
  }
  return data?.note ?? ''
}

export async function upsertOrder(
  activityId: string,
  items: { menuItemId: string; quantity: number }[],
  specialNote: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  // Only upsert items with quantity > 0; delete items with quantity = 0
  const toUpsert = items
    .filter((i) => i.quantity > 0)
    .map((i) => ({
      activity_id: activityId,
      user_id: user.id,
      menu_item_id: i.menuItemId,
      quantity: i.quantity,
    }))

  const toDelete = items.filter((i) => i.quantity === 0).map((i) => i.menuItemId)

  if (toUpsert.length > 0) {
    const { error } = await supabase
      .from('participant_order')
      .upsert(toUpsert, { onConflict: 'activity_id,user_id,menu_item_id' })
    if (error) throw new Error(error.message)
  }

  if (toDelete.length > 0) {
    const { error } = await supabase
      .from('participant_order')
      .delete()
      .eq('activity_id', activityId)
      .eq('user_id', user.id)
      .in('menu_item_id', toDelete)
    if (error) throw new Error(error.message)
  }

  const cleanedNote = specialNote.trim()
  if (cleanedNote.length > 150) throw new Error('Note must be 150 characters or fewer.')
  if (cleanedNote.length > 0) {
    const { error } = await supabase
      .from('participant_note')
      .upsert(
        {
          activity_id: activityId,
          user_id: user.id,
          note: cleanedNote,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'activity_id,user_id' }
      )
    if (error && !error.message.includes("Could not find the table 'public.participant_note'")) {
      throw new Error(error.message)
    }
  } else {
    const { error } = await supabase
      .from('participant_note')
      .delete()
      .eq('activity_id', activityId)
      .eq('user_id', user.id)
    if (error && !error.message.includes("Could not find the table 'public.participant_note'")) {
      throw new Error(error.message)
    }
  }
}

export async function clearMyOrder(activityId: string) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error: orderError } = await supabase
    .from('participant_order')
    .delete()
    .eq('activity_id', activityId)
    .eq('user_id', user.id)

  if (orderError) throw new Error(orderError.message)

  const { error: noteError } = await supabase
    .from('participant_note')
    .delete()
    .eq('activity_id', activityId)
    .eq('user_id', user.id)

  if (noteError && !noteError.message.includes("Could not find the table 'public.participant_note'")) {
    throw new Error(noteError.message)
  }
}

// ─── Admin ────────────────────────────────────────────────────────────────────

export async function getAdminSummary(activityId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const userEmail = normalizeEmail(user?.email)
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL)

  if (!user || !userEmail || userEmail !== adminEmail) {
    throw new Error('Forbidden')
  }

  const admin = createAdminClient()

  const { data: menuItems, error: menuErr } = await admin
    .from('menu_item')
    .select('id, name, unit, note, sort_order')
    .eq('activity_id', activityId)
    .order('sort_order')
  if (menuErr) {
    throw new Error(`menu_item query failed: ${menuErr.message}`)
  }

  const { data: orders, error: ordersErr } = await admin
    .from('participant_order')
    .select('user_id, menu_item_id, quantity')
    .eq('activity_id', activityId)
  if (ordersErr) {
    throw new Error(`participant_order query failed: ${ordersErr.message}`)
  }

  const { data: notes, error: notesErr } = await admin
    .from('participant_note')
    .select('user_id, note')
    .eq('activity_id', activityId)

  if (notesErr && !notesErr.message.includes("Could not find the table 'public.participant_note'")) {
    throw new Error(`participant_note query failed: ${notesErr.message}`)
  }
  const notesData = notes ?? []

  // Fetch user emails from auth.users via admin API
  const userIds = [...new Set((orders ?? []).map((o) => o.user_id))]
  const userMap: Record<string, string> = {}

  await Promise.all(
    userIds.map(async (uid) => {
      const { data } = await admin.auth.admin.getUserById(uid)
      userMap[uid] = data?.user?.user_metadata?.full_name ?? data?.user?.email ?? uid
    })
  )

  return {
    menuItems: menuItems ?? [],
    orders: orders ?? [],
    notes: notesData,
    userMap,
  }
}
