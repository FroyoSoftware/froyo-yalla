'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export default function ShareButton({ activityId }: { activityId: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    const url = `${window.location.origin}/activity/${activityId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:bg-accent transition-colors"
      aria-label="Copy link"
    >
      {copied ? <Check size={15} /> : <Copy size={15} />}
    </button>
  )
}
