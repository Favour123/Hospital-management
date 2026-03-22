'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { AppointmentTable } from '@/components/appointments/AppointmentTable'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/stores/useAuthStore'
import { createClient } from '@/lib/supabase/client'
import type { Appointment, AppointmentStatus } from '@/types'

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const { profile } = useAuthStore()

  const isStudent = profile?.role === 'STUDENT'
  const canCreate = profile?.role !== 'PHARMACY'

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('appointments')
      .select('*, patient:patients(full_name, patient_id), assignee:profiles!assigned_to(full_name, role)')
      .order('created_at', { ascending: false })
    setAppointments((data as Appointment[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function handleStatusChange(id: string, status: AppointmentStatus) {
    setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status } : a))
  }

  const filter = (statuses: AppointmentStatus[]) =>
    appointments.filter((a) => statuses.includes(a.status))

  return (
    <div>
      <DashboardHeader
        title={isStudent ? 'My Appointments' : 'Appointment Management'}
        subtitle="View and manage appointments"
        actions={
          canCreate && (
            <Link href="/appointments/new">
              <Button size="sm"><Plus className="h-4 w-4" /> {isStudent ? 'Request Appointment' : 'New Appointment'}</Button>
            </Link>
          )
        }
      />

      <div className="p-6">
        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All ({appointments.length})</TabsTrigger>
            <TabsTrigger value="active">Active ({filter(['CONFIRMED', 'PENDING', 'REQUESTED']).length})</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
          <TabsContent value="all">
            <AppointmentTable appointments={appointments} userRole={profile?.role ?? 'STUDENT'} onStatusChange={handleStatusChange} />
          </TabsContent>
          <TabsContent value="active">
            <AppointmentTable appointments={filter(['CONFIRMED', 'PENDING', 'REQUESTED', 'RESCHEDULED'])} userRole={profile?.role ?? 'STUDENT'} onStatusChange={handleStatusChange} />
          </TabsContent>
          <TabsContent value="completed">
            <AppointmentTable appointments={filter(['COMPLETED', 'CANCELLED'])} userRole={profile?.role ?? 'STUDENT'} onStatusChange={handleStatusChange} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
