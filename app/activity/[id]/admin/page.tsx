import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getActivityWithMenu, getAdminSummary, signOut } from '@/lib/actions'
import { normalizeEmail } from '@/lib/utils'

interface Props {
  params: Promise<{ id: string }>
}

export default async function AdminPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')
  const userEmail = normalizeEmail(user.email)
  const adminEmail = normalizeEmail(process.env.ADMIN_EMAIL)
  if (!userEmail || userEmail !== adminEmail) {
    redirect(`/activity/${id}`)
  }

  const [data, summary] = await Promise.all([
    getActivityWithMenu(id),
    getAdminSummary(id),
  ])

  if (!data) notFound()

  const { menuItems, orders, notes, userMap } = summary

  // Total per menu item
  const totals: Record<string, number> = {}
  for (const o of orders) {
    totals[o.menu_item_id] = (totals[o.menu_item_id] ?? 0) + o.quantity
  }
  const grandTotal = Object.values(totals).reduce((a, b) => a + b, 0)

  // Per-person breakdown
  const byUser: Record<string, Record<string, number>> = {}
  for (const o of orders) {
    if (!byUser[o.user_id]) byUser[o.user_id] = {}
    byUser[o.user_id][o.menu_item_id] = o.quantity
  }

  const userIds = Object.keys(byUser)
  const noteByUser: Record<string, string> = {}
  for (const n of notes) {
    noteByUser[n.user_id] = n.note
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{data.activity.title}</h1>
            <p className="text-sm text-muted-foreground mt-1">Organizer summary</p>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={`/activity/${id}`}
              className="text-xs text-muted-foreground underline"
            >
              Order page
            </a>
            <form action={signOut}>
              <button type="submit" className="text-xs text-muted-foreground underline">
                Sign out
              </button>
            </form>
          </div>
        </div>

        {/* Total per item */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Totals
          </h2>
          <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
            {menuItems.map((item) => {
              const qty = totals[item.id] ?? 0
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-4 py-4 bg-background"
                >
                  <div className="min-w-0 max-w-[72%]">
                    <p className="text-sm font-medium leading-snug">
                      {item.name}
                      <span className="ml-1 text-xs text-muted-foreground">/{item.unit}</span>
                    </p>
                    {item.note && (
                      <p className="mt-2 inline-flex rounded-md bg-muted px-2.5 py-1 text-xs font-normal text-muted-foreground">
                        {item.note}
                      </p>
                    )}
                  </div>
                  <span className="text-sm font-bold tabular-nums">{qty}</span>
                </div>
              )
            })}
            <div className="flex items-center justify-between gap-4 px-4 py-4 bg-muted/30">
              <p className="text-sm font-semibold">Total</p>
              <span className="text-sm font-bold tabular-nums">{grandTotal} items</span>
            </div>
          </div>
        </section>

        {/* Per-person breakdown */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Per-person breakdown ({userIds.length})
          </h2>
          <div className="space-y-3">
            {userIds.map((uid) => {
              const userOrders = byUser[uid]
              const name = userMap[uid] ?? uid
              return (
                <div key={uid} className="rounded-xl border border-border overflow-hidden">
                  <div className="px-4 py-3 bg-muted/40 space-y-2">
                    <p className="text-sm font-medium">{name}</p>
                    {noteByUser[uid] && (
                      <div className="rounded-md border border-border/70 bg-background/70 px-3 py-2">
                        <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Notes</p>
                        <p className="mt-1 text-xs text-foreground/85 leading-relaxed">{noteByUser[uid]}</p>
                      </div>
                    )}
                  </div>
                  <div className="divide-y divide-border">
                    {menuItems
                      .filter((m) => (userOrders[m.id] ?? 0) > 0)
                      .map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between gap-4 px-4 py-3 bg-background"
                        >
                          <p className="text-sm text-muted-foreground leading-snug min-w-0 max-w-[72%]">{m.name}</p>
                          <span className="text-sm tabular-nums">
                            {userOrders[m.id]} {m.unit}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              )
            })}

            {userIds.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                No orders yet.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}
