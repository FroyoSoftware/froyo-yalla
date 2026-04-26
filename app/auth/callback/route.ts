import { createClient } from '@/lib/supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Supabase passes through extra queryParams in the callback URL
      const returnTo = searchParams.get('returnTo')
      const dest = returnTo && returnTo.startsWith('/') ? returnTo : '/'
      return NextResponse.redirect(new URL(dest, origin))
    }
  }

  // Auth failed — redirect to login with error indicator
  return NextResponse.redirect(new URL('/login?error=auth', origin))
}
