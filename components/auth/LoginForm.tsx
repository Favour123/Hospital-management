'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { createClient } from '@/lib/supabase/client'
import { ROLE_DASHBOARD } from '@/lib/utils/rbac'
import type { UserRole } from '@/types'

const schema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type FormData = z.infer<typeof schema>

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const form = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setLoading(true)
    const supabase = createClient()
    const { data: authData, error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    // Fetch profile to get role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    if (!profile) {
      toast.error('Profile not found. Please contact admin.')
      setLoading(false)
      return
    }

    const role = profile.role as UserRole

    // Student gate: check onboarding
    if (role === 'STUDENT') {
      const { data: sp } = await supabase
        .from('student_profiles')
        .select('photo_done')
        .eq('id', authData.user.id)
        .single()
      if (sp && !sp.photo_done) {
        router.push('/onboarding/photo-upload')
        return
      }
    }

    toast.success('Welcome back!')
    router.push(ROLE_DASHBOARD[role])
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email address</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@adeleke.edu.ng" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    {...field}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          {loading ? 'Signing in…' : 'Sign In'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          New student?{' '}
          <Link href="/auth/signup" className="text-primary font-medium hover:underline">
            Create account
          </Link>
        </p>
      </form>
    </Form>
  )
}
