'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/stores/useAuthStore'
import { AppSidebar } from '@/components/layout/AppSidebar'
import { Skeleton } from '@/components/ui/skeleton'
import type { Profile, StudentProfile } from '@/types'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { profile, setProfile, setStudentProfile, setIsLoading, isLoading } = useAuthStore()

  useEffect(() => {
    async function loadSession() {
      setIsLoading(true)
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/auth/login')
        return
      }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileData) {
        setProfile(profileData as Profile)

        if (profileData.role === 'STUDENT') {
          const { data: sp } = await supabase
            .from('student_profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          if (sp) setStudentProfile(sp as StudentProfile)
        }
      }

      setIsLoading(false)
    }

    if (!profile) loadSession()
    else setIsLoading(false)
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-screen">
        <div className="w-64 border-r bg-sidebar p-4 space-y-3">
          <Skeleton className="h-12 rounded-xl" />
          <Skeleton className="h-8 rounded-lg" />
          <Skeleton className="h-8 rounded-lg" />
          <Skeleton className="h-8 rounded-lg" />
        </div>
        <div className="flex-1 p-6 space-y-4">
          <Skeleton className="h-12 rounded-lg" />
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
          </div>
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}
