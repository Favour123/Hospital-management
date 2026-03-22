import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/middleware'
import { ROLE_DASHBOARD, canAccessRoute } from '@/lib/utils/rbac'
import type { UserRole } from '@/types'

// Pages that are always accessible without authentication
const PUBLIC_PATHS = ['/auth/login', '/auth/signup', '/auth/verify', '/auth/confirm-success']

// The callback route must ALWAYS pass through so that Supabase can
// exchange the one-time code for a session – even if the user already
// has a session (which Supabase creates immediately on signUp).
const CALLBACK_PATH = '/auth/callback'

const ONBOARDING_PATH = '/onboarding/photo-upload'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  try {
    const { supabaseResponse, user, supabase } = await updateSession(request)

    // ── Callback: always let it through so code exchange works ──────────
    if (pathname.startsWith(CALLBACK_PATH)) {
      return supabaseResponse
    }

    // ── Public paths ─────────────────────────────────────────────────────
    if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
      // Allow users to see the confirmation success page even if authenticated
      if (pathname.startsWith('/auth/confirm-success')) {
        return supabaseResponse
      }

      if (user) {
        // Already authenticated → send to their dashboard
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single()

        if (profile) {
          const role = profile.role as UserRole

          // Students who haven't uploaded their photo go to onboarding
          if (role === 'STUDENT') {
            const { data: sp } = await supabase
              .from('student_profiles')
              .select('photo_done')
              .eq('id', user.id)
              .single()

            if (sp && !sp.photo_done) {
              return NextResponse.redirect(new URL(ONBOARDING_PATH, request.url))
            }
          }

          const dest = ROLE_DASHBOARD[role]
          return NextResponse.redirect(new URL(dest, request.url))
        }
      }
      return supabaseResponse
    }

    // ── Unauthenticated → login ──────────────────────────────────────────
    if (!user) {
      const loginUrl = new URL('/auth/login', request.url)
      loginUrl.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(loginUrl)
    }

    // ── Fetch profile ────────────────────────────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.redirect(new URL('/auth/login', request.url))
    }

    const role = profile.role as UserRole

    // ── Student onboarding gate ──────────────────────────────────────────
    // If a student hasn't uploaded their photo, force them to onboarding
    // (skip this check when they're already on the onboarding page)
    if (role === 'STUDENT' && !pathname.startsWith(ONBOARDING_PATH)) {
      const { data: sp } = await supabase
        .from('student_profiles')
        .select('photo_done')
        .eq('id', user.id)
        .single()

      if (sp && !sp.photo_done) {
        return NextResponse.redirect(new URL(ONBOARDING_PATH, request.url))
      }
    }

    // Non-students must not access onboarding
    if (pathname.startsWith(ONBOARDING_PATH) && role !== 'STUDENT') {
      return NextResponse.redirect(new URL(ROLE_DASHBOARD[role], request.url))
    }

    // ── RBAC route guard ─────────────────────────────────────────────────
    if (
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/patients') ||
      pathname.startsWith('/encounters') ||
      pathname.startsWith('/appointments')
    ) {
      if (!canAccessRoute(role, pathname)) {
        return NextResponse.redirect(new URL(ROLE_DASHBOARD[role], request.url))
      }
    }

    return supabaseResponse
  } catch {
    // Supabase unreachable: allow public paths, redirect everything else
    if (
      pathname.startsWith(CALLBACK_PATH) ||
      PUBLIC_PATHS.some((p) => pathname.startsWith(p))
    ) {
      return NextResponse.next()
    }
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(loginUrl)
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|\\.well-known|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
