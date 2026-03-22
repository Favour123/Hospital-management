'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Calendar, Users, Plus, Search, Clock } from 'lucide-react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { AppointmentTable } from '@/components/appointments/AppointmentTable'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { createClient } from '@/lib/supabase/client'
import type { Appointment, AppointmentStatus } from '@/types'

export default function ReceptionistDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const [patientCount, setPatientCount] = useState(0)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [apptRes, patRes] = await Promise.all([
      supabase
        .from('appointments')
        .select('*, patient:patients(full_name, patient_id), assignee:profiles!assigned_to(full_name, role)')
        .order('created_at', { ascending: false }),
      supabase.from('patients').select('id', { count: 'exact', head: true }),
    ])
    setAppointments((apptRes.data as Appointment[]) ?? [])
    setPatientCount(patRes.count ?? 0)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function handleStatusChange(id: string, status: AppointmentStatus) {
    setAppointments((prev) => prev.map((a) => a.id === id ? { ...a, status } : a))
  }

  const stats = {
    requested: appointments.filter((a) => a.status === 'REQUESTED').length,
    confirmed: appointments.filter((a) => a.status === 'CONFIRMED').length,
    today: appointments.filter((a) =>
      a.scheduled_at && new Date(a.scheduled_at).toDateString() === new Date().toDateString()
    ).length,
  }

  const filterAppts = (statuses: AppointmentStatus[]) =>
    appointments.filter((a) => statuses.includes(a.status))

  return (
    <div>
      <DashboardHeader
        title="Receptionist Dashboard"
        subtitle={format(new Date(), 'EEEE, dd MMMM yyyy')}
        actions={
          <div className="flex gap-2">
            <Link href="/patients/new">
              <Button size="sm" variant="outline"><Plus className="h-4 w-4" /> Register Patient</Button>
            </Link>
            <Link href="/patients">
              <Button size="sm" variant="outline"><Search className="h-4 w-4" /> Search Patient</Button>
            </Link>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="New Requests" value={stats.requested} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-100" />
          <StatsCard title="Confirmed Today" value={stats.today} icon={Calendar} />
          <StatsCard title="All Confirmed" value={stats.confirmed} icon={Calendar} iconColor="text-green-600" iconBg="bg-green-100" />
          <StatsCard title="Total Patients" value={patientCount} icon={Users} iconColor="text-blue-600" iconBg="bg-blue-100" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Appointment Management</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="all">
              <div className="px-4 pt-0 pb-2">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="requested">Requested ({stats.requested})</TabsTrigger>
                  <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </div>
              <TabsContent value="all" className="mt-0">
                <AppointmentTable appointments={appointments} userRole="RECEPTIONIST" onStatusChange={handleStatusChange} />
              </TabsContent>
              <TabsContent value="requested" className="mt-0">
                <AppointmentTable appointments={filterAppts(['REQUESTED', 'PENDING'])} userRole="RECEPTIONIST" onStatusChange={handleStatusChange} />
              </TabsContent>
              <TabsContent value="confirmed" className="mt-0">
                <AppointmentTable appointments={filterAppts(['CONFIRMED', 'RESCHEDULED'])} userRole="RECEPTIONIST" onStatusChange={handleStatusChange} />
              </TabsContent>
              <TabsContent value="completed" className="mt-0">
                <AppointmentTable appointments={filterAppts(['COMPLETED', 'CANCELLED'])} userRole="RECEPTIONIST" onStatusChange={handleStatusChange} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
