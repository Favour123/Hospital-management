'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Calendar, Stethoscope, Clock, Users } from 'lucide-react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RecentEncountersList } from '@/components/dashboard/RecentEncountersList'
import { AppointmentTable } from '@/components/appointments/AppointmentTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/useAuthStore'
import { createClient } from '@/lib/supabase/client'
import type { Appointment, Encounter } from '@/types'

export default function DoctorDashboard() {
  const { profile } = useAuthStore()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [encounters, setEncounters] = useState<Encounter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!profile?.id) return
      const supabase = createClient()
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      const [apptRes, encRes] = await Promise.all([
        supabase
          .from('appointments')
          .select('*, patient:patients(full_name, patient_id), assignee:profiles!assigned_to(full_name, role)')
          .eq('assigned_to', profile.id)
          .in('status', ['CONFIRMED', 'PENDING'])
          .order('scheduled_at', { ascending: true }),
        supabase
          .from('encounters')
          .select('*, patient:patients(full_name, patient_id), doctor:profiles!doctor_id(full_name, id_number)')
          .eq('doctor_id', profile.id)
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      setAppointments((apptRes.data as Appointment[]) ?? [])
      setEncounters((encRes.data as Encounter[]) ?? [])
      setLoading(false)
    }
    load()
  }, [profile])

  const todayAppts = appointments.filter((a) => {
    if (!a.scheduled_at) return false
    return new Date(a.scheduled_at).toDateString() === new Date().toDateString()
  })

  return (
    <div>
      <DashboardHeader
        title={`Dr. ${profile?.full_name?.split(' ')[0] ?? ''}'s Dashboard`}
        subtitle={`Today, ${format(new Date(), 'EEEE dd MMMM yyyy')}`}
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Today's Appointments" value={todayAppts.length} icon={Calendar} />
          <StatsCard title="Upcoming Appointments" value={appointments.length} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-100" />
          <StatsCard title="Recent Encounters" value={encounters.length} icon={Stethoscope} iconColor="text-primary" iconBg="bg-primary/10" />
          <StatsCard title="Staff ID" value={profile?.id_number ?? '—'} icon={Users} iconColor="text-blue-600" iconBg="bg-blue-100" />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" /> My Upcoming Schedule
              </CardTitle></CardHeader>
              <CardContent className="p-0">
                <AppointmentTable appointments={appointments} userRole="DOCTOR" />
              </CardContent>
            </Card>
          </div>
          <div>
            <RecentEncountersList encounters={encounters} loading={loading} />
          </div>
        </div>
      </div>
    </div>
  )
}
