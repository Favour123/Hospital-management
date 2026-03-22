'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Stethoscope } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { resolvePatientId } from '@/lib/utils/resolvePatient'

const schema = z.object({
  patient_id: z.string().min(1, 'Patient ID or Matric Number is required'),
  complaint: z.string().min(5, 'Complaint is required'),
  history: z.string().optional(),
  diagnosis: z.string().min(3, 'Diagnosis is required'),
  treatment: z.string().optional(),
  prescriptions: z.string().optional(),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface EncounterFormProps {
  patientId?: string
  patientName?: string
}

export function EncounterForm({ patientId, patientName: initialPatientName }: EncounterFormProps) {
  const router = useRouter()
  const [resolving, setResolving] = useState(false)
  const [resolvedPatient, setResolvedPatient] = useState<{ id: string; name: string } | null>(
    patientId && initialPatientName ? { id: patientId, name: initialPatientName } : null
  )

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { patient_id: patientId ?? '' },
  })

  async function onSubmit(data: FormData) {
    setResolving(true)
    const result = await resolvePatientId(data.patient_id)
    setResolving(false)
    if (!result) return

    if (result.name) setResolvedPatient(result)

    const res = await fetch('/api/encounters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, patient_id: result.id }),
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error ?? 'Failed to save encounter'); return }

    toast.success('Encounter recorded successfully')
    router.push(`/patients/${result.id}`)
  }

  const patientName = resolvedPatient?.name || initialPatientName

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {patientName && (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-lg border border-primary/20">
            <Stethoscope className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Patient: <strong>{patientName}</strong></span>
          </div>
        )}

        {!patientId && (
          <Card>
            <CardContent className="pt-4">
              <FormField control={form.control} name="patient_id" render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient ID / Matric No</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input placeholder="e.g. AUMC-2024-0001 or au/2024" {...field} />
                      {resolving && <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Clinical Assessment</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="complaint" render={({ field }) => (
              <FormItem>
                <FormLabel>Chief Complaint *</FormLabel>
                <FormControl><Textarea placeholder="Patient's primary complaint…" rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="history" render={({ field }) => (
              <FormItem>
                <FormLabel>Medical History</FormLabel>
                <FormControl><Textarea placeholder="Relevant past medical history, allergies…" rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="diagnosis" render={({ field }) => (
              <FormItem>
                <FormLabel>Diagnosis *</FormLabel>
                <FormControl><Textarea placeholder="Clinical diagnosis…" rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Treatment Plan</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="treatment" render={({ field }) => (
              <FormItem>
                <FormLabel>Treatment Plan</FormLabel>
                <FormControl><Textarea placeholder="Recommended treatment…" rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="prescriptions" render={({ field }) => (
              <FormItem>
                <FormLabel>Prescriptions</FormLabel>
                <FormControl><Textarea placeholder="Medications prescribed (name, dosage, frequency)…" rows={3} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="notes" render={({ field }) => (
              <FormItem>
                <FormLabel>Clinician Notes</FormLabel>
                <FormControl><Textarea placeholder="Additional clinical notes…" rows={2} {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <div className="flex gap-3 justify-end">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Encounter
          </Button>
        </div>
      </form>
    </Form>
  )
}
