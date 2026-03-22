'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Calendar, Clock, CheckCircle, Plus, Stethoscope, ClipboardList } from 'lucide-react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { AppointmentTable } from '@/components/appointments/AppointmentTable'
import { EncounterCard } from '@/components/encounters/EncounterCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/useAuthStore'
import { createClient } from '@/lib/supabase/client'
import type { Appointment, Encounter } from '@/types'

export default function StudentDashboard() {
  const { profile, studentProfile } = useAuthStore()
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [encounters, setEncounters] = useState<Encounter[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const resAppt = await fetch('/api/appointments?limit=10')
      const resEnc = await fetch('/api/encounters?limit=10')
      
      const appts = resAppt.ok ? await resAppt.json() : []
      const encs = resEnc.ok ? await resEnc.json() : []
      
      setAppointments(appts)
      setEncounters(encs)
      setLoading(false)
    }
    load()
  }, [])

  const stats = {
    total: appointments.length,
    confirmed: appointments.filter((a) => a.status === 'CONFIRMED').length,
    pending: appointments.filter((a) => ['REQUESTED', 'PENDING'].includes(a.status)).length,
    completed: appointments.filter((a) => a.status === 'COMPLETED').length,
    encounters: encounters.length,
  }

  const initials = profile?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'S'

  return (
    <div>
      <DashboardHeader
        title="Student Portal"
        subtitle="Adeleke University Medical Center"
        actions={
          <Link href="/appointments/new">
            <Button size="sm"><Plus className="h-4 w-4" /> Request Appointment</Button>
          </Link>
        }
      />

      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        {/* Profile card */}
        <Card className="border-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg">
          <CardContent className="p-8 flex items-center gap-6">
            <Avatar className="h-20 w-20 border-4 border-white/20 shadow-xl">
              <AvatarImage src={profile?.photo_url ?? undefined} />
              <AvatarFallback className="bg-white/10 text-white text-2xl font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-2xl font-extrabold tracking-tight truncate">{profile?.full_name}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-white/20 text-white border-0 hover:bg-white/30">{profile?.id_number}</Badge>
                <span className="text-primary-foreground/80 font-medium">· Student Account</span>
              </div>
              <div className="flex items-center gap-3 mt-4 flex-wrap">
                {profile?.is_verified && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full text-[11px] font-semibold border border-white/10">
                    <CheckCircle className="h-3 w-3" /> Verified Account
                  </div>
                )}
                {studentProfile?.photo_done && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-400/20 text-amber-200 rounded-full text-[11px] font-semibold border border-amber-400/20">
                    <CheckCircle className="h-3 w-3" /> Profile Photo Ready
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Appointments" value={stats.total} icon={Calendar} />
          <StatsCard title="Confirmed" value={stats.confirmed} icon={CheckCircle} iconColor="text-emerald-600" iconBg="bg-emerald-50" />
          <StatsCard title="Pending" value={stats.pending} icon={Clock} iconColor="text-amber-600" iconBg="bg-amber-50" />
          <StatsCard title="Medical Visits" value={stats.encounters} icon={Stethoscope} iconColor="text-indigo-600" iconBg="bg-indigo-50" />
        </div>

        {/* History Tabs */}
        <Tabs defaultValue="appointments" className="space-y-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="appointments" className="flex items-center gap-2 data-[state=active]:bg-background">
              <Calendar className="h-4 w-4" /> Appointments
            </TabsTrigger>
            <TabsTrigger value="encounters" className="flex items-center gap-2 data-[state=active]:bg-background">
              <ClipboardList className="h-4 w-4" /> Medical History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="appointments" className="space-y-4">
            <Card className="border-muted/60">
              <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recent Appointments</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">Track your clinic visit requests</p>
                </div>
                <Link href="/appointments/new">
                  <Button size="sm" variant="outline" className="h-8">
                    <Plus className="h-3.5 w-3.5" /> New Request
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {loading ? (
                  <div className="p-8 space-y-3">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="p-12 text-center text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto opacity-20 mb-3" />
                    <p className="font-medium text-foreground">No appointments requested yet</p>
                    <p className="text-sm mt-1">Submit your first appointment request to get started.</p>
                  </div>
                ) : (
                  <AppointmentTable appointments={appointments} userRole="STUDENT" />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="encounters" className="space-y-4">
            <Card className="border-muted/60">
              <CardHeader className="pb-3 border-b">
                <CardTitle className="text-lg">My Encounter Records</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Your medical consultation history</p>
              </CardHeader>
              <CardContent className="p-6">
                {loading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full rounded-xl" />
                    <Skeleton className="h-32 w-full rounded-xl" />
                  </div>
                ) : encounters.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">
                    <Stethoscope className="h-12 w-12 mx-auto opacity-20 mb-3" />
                    <p className="font-medium text-foreground">No medical records found</p>
                    <p className="text-sm mt-1">Your visit history will appear here after your first consultation.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {encounters.map((enc) => (
                      <EncounterCard key={enc.id} encounter={enc} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
