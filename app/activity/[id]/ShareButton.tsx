'use client'

import { useState } from 'react'

export default function ShareButton({ activityId }: { activityId: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    const url = `${window.location.origin}/activity/${activityId}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button onClick={copy} className="text-xs text-muted-foreground underline">
      {copied ? 'Copied!' : 'Share'}
    </button>
  )
}
