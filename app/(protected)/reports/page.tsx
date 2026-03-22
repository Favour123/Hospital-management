'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend, LineChart, Line } from 'recharts'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Calendar, Stethoscope, TrendingUp, BarChart3 } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: '#f59e0b', PENDING: '#3b82f6', CONFIRMED: '#006B3E',
  RESCHEDULED: '#8b5cf6', CANCELLED: '#ef4444', COMPLETED: '#C9A227',
}

export default function ReportsPage() {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/reports').then((r) => r.json()).then((d) => { setReport(d); setLoading(false) })
  }, [])

  if (loading) return <div className="p-6 text-muted-foreground">Loading reports…</div>

  return (
    <div>
      <DashboardHeader
        title="Reports & Analytics"
        subtitle={`SMARTMED · ${format(new Date(), 'dd MMMM yyyy')}`}
      />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatsCard title="Total Patients" value={report?.totalPatients ?? 0} icon={Users} />
          <StatsCard title="Today's Appointments" value={report?.todayAppointments ?? 0} icon={Calendar} />
          <StatsCard title="Recent Encounters" value={report?.totalEncounters ?? 0} icon={Stethoscope} iconColor="text-primary" iconBg="bg-primary/10" />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" />Appointments by Status</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={report?.appointmentsByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label={({ status, count }) => `${status}: ${count}`}>
                      {(report?.appointmentsByStatus ?? []).map((e: any) => (
                        <Cell key={e.status} fill={STATUS_COLORS[e.status] ?? '#aaa'} />
                      ))}
                    </Pie>
                    <Tooltip /><Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><TrendingUp className="h-4 w-4 text-primary" />Monthly Activity</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={report?.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip /><Legend />
                    <Bar dataKey="patients" fill="#006B3E" name="Patients" radius={[4,4,0,0]} />
                    <Bar dataKey="appointments" fill="#C9A227" name="Appointments" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
