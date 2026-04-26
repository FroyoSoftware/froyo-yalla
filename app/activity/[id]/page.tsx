import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { getActivityWithMenu, getMyOrders, getMySpecialNote } from '@/lib/actions'
import OrderForm from './OrderForm'
import ShareButton from './ShareButton'
import { signOut } from '@/lib/actions'

function normalizeEmail(value: string | null | undefined) {
  return (value ?? '').trim().replace(/^['\"]|['\"]$/g, '').toLowerCase()
}

interface Props {
  params: Promise<{ id: string }>
}

export default async function ActivityPage({ params }: Props) {
  const { id } = await params

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const data = await getActivityWithMenu(id)
  if (!data) notFound()

  const myOrders = await getMyOrders(id)
  const mySpecialNote = await getMySpecialNote(id)
  const initialOrders: Record<string, number> = {}
  for (const order of myOrders) {
    initialOrders[order.menu_item_id] = order.quantity
  }

  const userName =
    user.user_metadata?.full_name ?? user.email ?? 'Guest'

  const isOrganizer = normalizeEmail(user.email) === normalizeEmail(process.env.ADMIN_EMAIL)

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{data.activity.title}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-sm text-muted-foreground">
              {data.activity.organizer_name && (
                <>
                  <span>Host: {data.activity.organizer_name}</span>
                  {data.activity.end_at && <span className="select-none">·</span>}
                </>
              )}
              {data.activity.end_at && (
                <span>Order by {new Date(data.activity.end_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              )}
            </div>
            {data.activity.description && (
              <p className="mt-2 text-sm text-muted-foreground">{data.activity.description}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ShareButton activityId={id} />
            {isOrganizer && (
              <a
                href={`/activity/${id}/admin`}
                className="text-xs underline text-muted-foreground"
              >
                Organizer
              </a>
            )}
            <form action={signOut}>
              <button
                type="submit"
                className="text-xs text-muted-foreground underline"
              >
                Sign out
              </button>
            </form>
          </div>
        </div>

        <OrderForm
          activityId={id}
          menuItems={data.menuItems}
          initialOrders={initialOrders}
          initialSpecialNote={mySpecialNote}
          userName={userName}
        />
      </div>
    </main>
  )
}
