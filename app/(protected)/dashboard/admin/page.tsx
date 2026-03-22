'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { Users, Calendar, Stethoscope, BarChart3, ShieldCheck, TrendingUp } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RecentEncountersList } from '@/components/dashboard/RecentEncountersList'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import type { Encounter } from '@/types'

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: '#f59e0b',
  PENDING: '#3b82f6',
  CONFIRMED: '#006B3E',
  RESCHEDULED: '#8b5cf6',
  CANCELLED: '#ef4444',
  COMPLETED: '#C9A227',
}

export default function AdminDashboard() {
  const [report, setReport] = useState<{
    totalPatients: number
    todayAppointments: number
    totalEncounters: number
    recentEncounters: Encounter[]
    appointmentsByStatus: { status: string; count: number }[]
    monthlyData: { month: string; patients: number; appointments: number }[]
  } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/reports')
      const json = await res.json()
      setReport(json)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div>
      <DashboardHeader
        title="Admin Dashboard"
        subtitle={`SMARTMED Control Panel · ${format(new Date(), 'EEEE, dd MMMM yyyy')}`}
      />

      <div className="p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard title="Total Patients" value={report?.totalPatients ?? '—'} icon={Users} />
          <StatsCard title="Today's Appointments" value={report?.todayAppointments ?? '—'} icon={Calendar} />
          <StatsCard title="Total Encounters" value={report?.totalEncounters ?? '—'} icon={Stethoscope} iconColor="text-primary" iconBg="bg-primary/10" />
          <StatsCard title="System Status" value="Online" icon={ShieldCheck} iconColor="text-green-600" iconBg="bg-green-100" />
        </div>

        {/* Charts row */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Appointments by status pie */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary" /> Appointments by Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report?.appointmentsByStatus && (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={report.appointmentsByStatus}
                        dataKey="count"
                        nameKey="status"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        label={({ status, count }) => `${status}: ${count}`}
                        labelLine={false}
                      >
                        {report.appointmentsByStatus.map((entry) => (
                          <Cell key={entry.status} fill={STATUS_COLORS[entry.status] ?? '#ccc'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Monthly trend */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Monthly Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {report?.monthlyData && (
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={report.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="patients" fill="#006B3E" name="Patients" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="appointments" fill="#C9A227" name="Appointments" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent encounters */}
        <RecentEncountersList
          encounters={report?.recentEncounters ?? []}
          loading={loading}
        />
      </div>
    </div>
  )
}
