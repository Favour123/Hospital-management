import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { ROLE_DASHBOARD } from '@/lib/utils/rbac'
import type { UserRole } from '@/types'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createServerClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Mark email as verified (also handled by DB trigger, but belt-and-suspenders)
      await Promise.all([
        supabase
          .from('profiles')
          .update({ is_verified: true })
          .eq('id', data.user.id),
        supabase
          .from('student_profiles')
          .update({ email_done: true })
          .eq('id', data.user.id),
      ])

      // Redirect based on role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()

      if (profile?.role === 'STUDENT') {
        // Students must upload their photo before accessing the app
        return NextResponse.redirect(`${origin}/onboarding/photo-upload`)
      }

      const role = profile?.role as UserRole | undefined
      const dest = role ? ROLE_DASHBOARD[role] : '/auth/login'
      return NextResponse.redirect(`${origin}${dest}`)
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=verification_failed`)
}
