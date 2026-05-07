'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Calendar, Stethoscope } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/useAuthStore'
import { resolvePatientId } from '@/lib/utils/resolvePatient'

const schema = z.object({
  patient_id: z.string().optional(),
  preferred_date: z.string().min(1, 'Preferred date is required'),
  reason: z.string().min(5, 'Please provide a reason'),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface AppointmentFormProps {
  patientId?: string
  patientName?: string
  mode?: 'request' | 'schedule'
}

export function AppointmentForm({ patientId, patientName: initialPatientName, mode = 'request' }: AppointmentFormProps) {
  const router = useRouter()
  const { profile } = useAuthStore()
  const [resolving, setResolving] = useState(false)
  const [resolvedPatient, setResolvedPatient] = useState<{ id: string; name: string } | null>(
    patientId && initialPatientName ? { id: patientId, name: initialPatientName } : null
  )

  const isStudent = profile?.role === 'STUDENT'

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { 
      patient_id: patientId ?? '',
      preferred_date: '',
      reason: '',
      notes: '',
    },
  })

  async function onSubmit(data: FormData) {
    // If not a student and no patient ID was passed in props, validate the input
    if (!isStudent && !patientId && !data.patient_id) {
      form.setError('patient_id', { message: 'Patient ID is required' })
      return
    }

    let actualPatientId = data.patient_id
    
    // Students have their ID resolved in the backend via session
    if (!isStudent) {
      setResolving(true)
      const result = await resolvePatientId(data.patient_id!)
      setResolving(false)
      if (!result) return
      actualPatientId = result.id
      if (result.name) setResolvedPatient(result)
    }

    const res = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: actualPatientId || null,
        preferred_date: data.preferred_date,
        reason: data.reason,
        notes: data.notes,
      }),
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error ?? 'Failed to create appointment'); return }

    toast.success('Appointment request submitted successfully')
    router.push('/appointments')
  }

  const patientNameDisplay = resolvedPatient?.name || initialPatientName

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {patientNameDisplay && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-lg border border-primary/20">
            <Stethoscope className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Patient: <strong>{patientNameDisplay}</strong></span>
          </div>
        )}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              {mode === 'request' ? 'Request an Appointment' : 'Schedule Appointment'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!patientId && !isStudent && (
              <FormField control={form.control} name="patient_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient ID / Matric Number *</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="e.g. AUMC-YYYY-XXXX or au/2024" {...field} />
                      {resolving && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}

            <FormField control={form.control} name="preferred_date" render={({ field }) => (
              <FormItem>
                <FormLabel>Preferred Date & Time *</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field}
                    min={new Date().toISOString().slice(0, 16)} />
                </FormControl>
                {isStudent && (
                  <FormDescription>Choose a preferred date. The clinic will confirm the exact time.</FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="reason" render={({ field }) => (
              <FormItem>
                <FormLabel>Reason for Visit *</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe your symptoms or reason for visiting the clinic…" rows={4} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />

            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Notes</FormLabel>
                <FormControl>
                  <Textarea placeholder="Any additional information…" rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === 'request' ? 'Submit Request' : 'Schedule Appointment'}
          </Button>
        </div>
      </form>
    </Form>
  )
}
