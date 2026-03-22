'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  User, Phone, Mail, Calendar, MapPin, IdCard,
  Plus, Stethoscope, ClipboardList, ArrowLeft,
} from 'lucide-react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { EncounterCard } from '@/components/encounters/EncounterCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { AppointmentTable } from '@/components/appointments/AppointmentTable'
import { useAuthStore } from '@/stores/useAuthStore'
import { createClient } from '@/lib/supabase/client'
import type { Patient, Encounter, Appointment } from '@/types'

export default function PatientProfilePage() {
  const { id } = useParams<{ id: string }>()
  const { profile } = useAuthStore()
  const [patient, setPatient] = useState<Patient | null>(null)
  const [encounters, setEncounters] = useState<Encounter[]>([])
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  const canCreateEncounter = ['ADMIN', 'DOCTOR'].includes(profile?.role ?? '')
  const canCreateAppointment = ['ADMIN', 'RECEPTIONIST'].includes(profile?.role ?? '')

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [patRes, encRes, apptRes] = await Promise.all([
        supabase.from('patients').select('*').eq('id', id).single(),
        supabase
          .from('encounters')
          .select('*, doctor:profiles!doctor_id(full_name, id_number)')
          .eq('patient_id', id)
          .order('created_at', { ascending: false }),
        supabase
          .from('appointments')
          .select('*, patient:patients(full_name, patient_id), assignee:profiles!assigned_to(full_name, role)')
          .eq('patient_id', id)
          .order('created_at', { ascending: false }),
      ])
      setPatient(patRes.data as Patient)
      setEncounters((encRes.data as Encounter[]) ?? [])
      setAppointments((apptRes.data as Appointment[]) ?? [])
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 rounded-xl" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    )
  }

  if (!patient) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">Patient not found.</p>
        <Link href="/patients"><Button variant="outline" className="mt-3">Back to Patients</Button></Link>
      </div>
    )
  }

  const infoItems = [
    { icon: IdCard, label: 'Patient ID', value: patient.patient_id },
    { icon: IdCard, label: 'ID Number', value: patient.id_number ?? '—' },
    { icon: Mail, label: 'Email', value: patient.email ?? '—' },
    { icon: Phone, label: 'Phone', value: patient.phone ?? '—' },
    { icon: Calendar, label: 'Date of Birth', value: patient.date_of_birth ? format(new Date(patient.date_of_birth), 'dd MMM yyyy') : '—' },
    { icon: MapPin, label: 'Address', value: patient.address ?? '—' },
  ]

  return (
    <div>
      <DashboardHeader
        title={patient.full_name}
        subtitle={`Patient ID: ${patient.patient_id}`}
        actions={
          <div className="flex gap-2">
            {canCreateEncounter && (
              <Link href={`/encounters/new?patient_id=${patient.id}&name=${encodeURIComponent(patient.full_name)}`}>
                <Button size="sm"><Stethoscope className="h-4 w-4" /> New Encounter</Button>
              </Link>
            )}
            {canCreateAppointment && (
              <Link href={`/appointments/new?patient_id=${patient.id}`}>
                <Button size="sm" variant="outline"><Plus className="h-4 w-4" /> New Appointment</Button>
              </Link>
            )}
          </div>
        }
      />

      <div className="p-6 space-y-6 max-w-5xl">
        <Link href="/patients" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Back to patients
        </Link>

        {/* Patient info card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{patient.full_name}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="outline" className="font-mono">{patient.patient_id}</Badge>
                  {patient.gender && <Badge variant="secondary">{patient.gender}</Badge>}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {infoItems.map((item) => (
                <div key={item.label} className="space-y-0.5">
                  <p className="helper-text flex items-center gap-1">
                    <item.icon className="h-3 w-3" /> {item.label}
                  </p>
                  <p className="text-sm font-medium text-foreground">{item.value}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="encounters">
          <TabsList>
            <TabsTrigger value="encounters">
              Encounters ({encounters.length})
            </TabsTrigger>
            <TabsTrigger value="appointments">
              Appointments ({appointments.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="encounters" className="space-y-3 mt-4">
            {canCreateEncounter && (
              <div className="flex justify-end">
                <Link href={`/encounters/new?patient_id=${patient.id}&name=${encodeURIComponent(patient.full_name)}`}>
                  <Button size="sm"><Plus className="h-4 w-4" /> Add Encounter</Button>
                </Link>
              </div>
            )}
            {encounters.length === 0 ? (
              <p className="text-center py-10 text-muted-foreground">No encounter records found.</p>
            ) : (
              encounters.map((enc) => <EncounterCard key={enc.id} encounter={enc} />)
            )}
          </TabsContent>

          <TabsContent value="appointments" className="mt-4">
            <AppointmentTable
              appointments={appointments}
              userRole={profile?.role ?? 'DOCTOR'}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
