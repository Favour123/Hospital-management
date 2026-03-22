import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

type SupabaseCookie = {
  name: string
  value: string
  options?: {
    path?: string
    domain?: string
    maxAge?: number
    expires?: Date
    httpOnly?: boolean
    secure?: boolean
    sameSite?: 'lax' | 'strict' | 'none'
  }
}

const AUTH_TIMEOUT_MS = 8_000

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet: SupabaseCookie[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  const timeoutFallback = new Promise<{ data: { user: null }; error: Error }>((resolve) =>
    setTimeout(
      () => resolve({ data: { user: null }, error: new Error('auth timeout') }),
      AUTH_TIMEOUT_MS,
    ),
  )

  const {
    data: { user },
  } = await Promise.race([supabase.auth.getUser(), timeoutFallback])

  return { supabaseResponse, user, supabase }
}
