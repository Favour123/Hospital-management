'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'

const schema = z.object({
  full_name: z.string().min(2, 'Full name is required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  date_of_birth: z.string().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  address: z.string().optional(),
  id_number: z.string().optional(),
})
type FormData = z.infer<typeof schema>

export function PatientForm() {
  const router = useRouter()
  const form = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { toast.error('Not authenticated'); return }

    const res = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error ?? 'Failed to create patient'); return }

    toast.success(`Patient ${json.patient_id} created successfully`)
    router.push(`/patients/${json.id}`)
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="full_name" render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Full Name *</FormLabel>
                <FormControl><Input placeholder="e.g. Adebayo Johnson" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="id_number" render={({ field }) => (
              <FormItem>
                <FormLabel>ID / Matric Number</FormLabel>
                <FormControl><Input placeholder="AUE/2024/001" {...field} /></FormControl>
                <FormDescription>Leave blank for non-students</FormDescription>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="date_of_birth" render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="gender" render={({ field }) => (
              <FormItem>
                <FormLabel>Gender</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input type="email" placeholder="patient@email.com" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="phone" render={({ field }) => (
              <FormItem>
                <FormLabel>Phone Number</FormLabel>
                <FormControl><Input placeholder="08012345678" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="address" render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Address</FormLabel>
                <FormControl><Textarea placeholder="Home address…" rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Register Patient
          </Button>
        </div>
      </form>
    </Form>
  )
}
