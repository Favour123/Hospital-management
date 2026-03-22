'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, UserPlus, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  role: z.enum(['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'STUDENT', 'PHARMACY'], {
    required_error: "Please select a role",
  }),
  idNumber: z.string().min(4, 'ID number is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})
type FormData = z.infer<typeof schema>

export function SignupForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const form = useForm<FormData>({ 
    resolver: zodResolver(schema),
    defaultValues: {
      role: 'STUDENT',
    }
  })

  const selectedRole = form.watch('role')

  async function onSubmit(data: FormData) {
    setLoading(true)
    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: {
          full_name: data.fullName,
          id_number: data.idNumber,
          role: data.role,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      toast.error(error.message)
      setLoading(false)
      return
    }

    toast.success('Account created! Please check your email to verify your account.')
    router.push('/auth/verify')
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Role</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your role" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="STUDENT">Student</SelectItem>
                    <SelectItem value="DOCTOR">Doctor</SelectItem>
                    <SelectItem value="NURSE">Nurse</SelectItem>
                    <SelectItem value="PHARMACY">Pharmacist</SelectItem>
                    <SelectItem value="RECEPTIONIST">Receptionist</SelectItem>
                    <SelectItem value="ADMIN">Administrator</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="idNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                {selectedRole === 'STUDENT' ? 'Matric Number' : 'Staff ID Number'}
              </FormLabel>
              <FormControl>
                <Input placeholder={selectedRole === 'STUDENT' ? 'AUE/2024/001' : 'STAFF/2024/001'} {...field} />
              </FormControl>
              <FormDescription>
                {selectedRole === 'STUDENT' 
                  ? 'Your Adeleke University matric number' 
                  : 'Your official staff identification number'}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>University Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@adeleke.edu.ng" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-muted-foreground">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="••••••••" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {loading ? 'Creating account…' : 'Create Account'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/auth/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </form>
    </Form>
  )
}
