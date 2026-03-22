'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Calendar, Clock, Users, CheckCircle } from 'lucide-react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { AppointmentTable } from '@/components/appointments/AppointmentTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuthStore } from '@/stores/useAuthStore'
import { createClient } from '@/lib/supabase/client'
import type { Appointment } from '@/types'

export default function NurseDashboard() {
  const { profile } = useAuthStore()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!profile?.id) return
      const supabase = createClient()
      const { data } = await supabase
        .from('appointments')
        .select('*, patient:patients(full_name, patient_id), assignee:profiles!assigned_to(full_name, role)')
        .eq('assigned_to', profile.id)
        .order('scheduled_at', { ascending: true })
      setAppointments((data as Appointment[]) ?? [])
      setLoading(false)
    }
    load()
  }, [profile])

  const todayAppts = appointments.filter((a) =>
    a.scheduled_at && new Date(a.scheduled_at).toDateString() === new Date().toDateString()
  )
  const confirmed = appointments.filter((a) => a.status === 'CONFIRMED').length

  return (
    <div>
      <DashboardHeader
        title={`Nurse ${profile?.full_name?.split(' ')[0] ?? ''}'s Dashboard`}
        subtitle={`Today, ${format(new Date(), 'EEEE dd MMMM yyyy')}`}
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Today's Assignments" value={todayAppts.length} icon={Calendar} />
          <StatsCard title="Confirmed Slots" value={confirmed} icon={CheckCircle} iconColor="text-green-600" iconBg="bg-green-100" />
          <StatsCard title="Total Assigned" value={appointments.length} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-100" />
          <StatsCard title="Staff ID" value={profile?.id_number ?? '—'} icon={Users} iconColor="text-blue-600" iconBg="bg-blue-100" />
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" /> My Schedule
          </CardTitle></CardHeader>
          <CardContent className="p-0">
            <AppointmentTable appointments={appointments} userRole="NURSE" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
