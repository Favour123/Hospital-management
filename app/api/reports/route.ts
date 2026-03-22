import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString()

  const [patientsRes, todayApptRes, allApptRes, encRes] = await Promise.all([
    supabase.from('patients').select('id', { count: 'exact', head: true }),
    supabase.from('appointments').select('id', { count: 'exact', head: true }).gte('scheduled_at', todayStr),
    supabase.from('appointments').select('status'),
    supabase
      .from('encounters')
      .select('*, patient:patients(full_name, patient_id), doctor:profiles!doctor_id(full_name, id_number)')
      .order('created_at', { ascending: false })
      .limit(10),
  ])

  // Appointments by status
  const statusMap: Record<string, number> = {}
  for (const appt of allApptRes.data ?? []) {
    statusMap[appt.status] = (statusMap[appt.status] ?? 0) + 1
  }
  const appointmentsByStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }))

  // Monthly data for last 6 months
  const months = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    months.push({
      month: d.toLocaleString('default', { month: 'short' }),
      year: d.getFullYear(),
      monthNum: d.getMonth(),
    })
  }

  // Simple mock aggregation (real would use DB grouping)
  const monthlyData = months.map((m) => ({
    month: m.month,
    patients: Math.floor(Math.random() * 20 + 5),  // Replace with real query in production
    appointments: Math.floor(Math.random() * 30 + 10),
  }))

  return NextResponse.json({
    totalPatients: patientsRes.count ?? 0,
    todayAppointments: todayApptRes.count ?? 0,
    totalEncounters: encRes.data?.length ?? 0,
    recentEncounters: encRes.data ?? [],
    appointmentsByStatus,
    monthlyData,
  })
}
