'use client'

import { useState, useTransition } from 'react'
import { upsertOrder } from '@/lib/actions'

interface MenuItem {
  id: string
  name: string
  unit: string
  note: string | null
  sort_order: number
}

interface Props {
  activityId: string
  menuItems: MenuItem[]
  initialOrders: Record<string, number>
  initialSpecialNote: string
  userName: string
}

export default function OrderForm({
  activityId,
  menuItems,
  initialOrders,
  initialSpecialNote,
  userName,
}: Props) {
  const [quantities, setQuantities] = useState<Record<string, number>>(initialOrders)
  const [specialNote, setSpecialNote] = useState(initialSpecialNote)
  const [hasOrdered, setHasOrdered] = useState(
    () => Object.values(initialOrders).some(v => v > 0)
  )
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function adjust(id: string, delta: number) {
    setQuantities((prev) => ({
      ...prev,
      [id]: Math.max(0, (prev[id] ?? 0) + delta),
    }))
    setSaved(false)
  }

  function handleSubmit() {
    setError(null)
    if (total === 0) {
      setError('Please select at least one item.')
      return
    }
    startTransition(async () => {
      try {
        const items = menuItems.map((m) => ({
          menuItemId: m.id,
          quantity: quantities[m.id] ?? 0,
        }))
        await upsertOrder(activityId, items, specialNote)
        setSaved(true)
        setHasOrdered(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save. Please try again.')
      }
    })
  }

  const total = Object.values(quantities).reduce((a, b) => a + b, 0)

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {userName}, choose how many items you want.
      </p>

      <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
        {menuItems.map((item) => {
          const qty = quantities[item.id] ?? 0
          return (
            <div
              key={item.id}
              className="flex items-center justify-between gap-4 px-4 py-4 bg-background"
            >
              <div className="min-w-0 max-w-[70%]">
                <p className="text-sm font-medium leading-snug">
                  {item.name}
                  <span className="ml-1 text-xs text-muted-foreground">/{item.unit}</span>
                </p>
                {item.note && (
                  <p className="mt-1.5 inline-flex rounded-md bg-muted px-2.5 py-1 text-xs font-normal text-muted-foreground">
                    {item.note}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => adjust(item.id, -1)}
                  disabled={qty === 0}
                  className="w-11 h-11 rounded-full border border-border text-lg font-semibold flex items-center justify-center disabled:opacity-30 hover:bg-accent transition-colors"
                  aria-label={`Decrease ${item.name}`}
                >
                  −
                </button>
                <span className="w-8 text-center text-sm font-medium tabular-nums">
                  {qty}
                </span>
                <button
                  onClick={() => adjust(item.id, 1)}
                  className="w-11 h-11 rounded-full border border-border text-lg font-semibold flex items-center justify-center hover:bg-accent transition-colors"
                  aria-label={`Increase ${item.name}`}
                >
                  +
                </button>
              </div>
            </div>
          )
        })}
      </div>

      <div className="rounded-xl border border-border bg-card/30 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <label htmlFor="special-note" className="text-sm font-medium">
            Notes
          </label>
          <p className="text-xs text-muted-foreground">{specialNote.length}/150</p>
        </div>
        <textarea
          id="special-note"
          value={specialNote}
          onChange={(e) => {
            setSpecialNote(e.target.value)
            setSaved(false)
          }}
          placeholder="Anything else you want to eat?"
          className="w-full min-h-28 rounded-lg border border-border bg-background px-3 py-2.5 text-sm leading-relaxed outline-none focus:ring-2 focus:ring-ring"
          maxLength={150}
        />
      </div>

      <div className="flex items-center justify-between pt-2">
        <span className="text-sm text-muted-foreground">
          Total <span className="font-semibold text-foreground">{total}</span> items
        </span>
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="px-6 py-2.5 rounded-lg bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isPending ? 'Saving...' : saved ? 'Saved' : hasOrdered ? 'Update' : 'Submit'}
        </button>
      </div>

      {saved && (
        <p className="text-center text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg py-2 px-3">
          Your order has been saved. You can update it anytime.
        </p>
      )}

      {error && (
        <p className="text-center text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg py-2 px-3">
          {error}
        </p>
      )}
    </div>
  )
}
