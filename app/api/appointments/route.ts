import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/utils/auditLog'

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  const url = new URL(req.url)
  const status = url.searchParams.get('status')

  let query = supabase
    .from('appointments')
    .select('*, patient:patients(full_name, patient_id, id_number, user_id), assignee:profiles!assigned_to(full_name, role), requester:profiles!requested_by(full_name, role)')
    .order('created_at', { ascending: false })

  // Students can only see their own
  if (profile?.role === 'STUDENT') {
    query = query.eq('requested_by', user.id)
  }

  if (status) query = query.eq('status', status)

  const { data, error } = await query.limit(100)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ─── Resolve Student Profiles (via user_id or id_number) ───
  const patientUserIds = data.map((appt: any) => appt.patient?.user_id).filter(Boolean)
  const idNumbers = data.map((appt: any) => appt.patient?.id_number).filter(Boolean)
  
  if (patientUserIds.length > 0 || idNumbers.length > 0) {
    const { data: studentData } = await supabase
      .from('profiles')
      .select(`
        id,
        id_number, 
        role, 
        student:student_profiles(photo_url, photo_done, email_done)
      `)
      .or(`id.in.(${patientUserIds.join(',')}),id_number.in.(${idNumbers.map(id => `"${id}"`).join(',')})`)
      .eq('role', 'STUDENT')

    if (studentData) {
      const studentMapById = Object.fromEntries(studentData.map((p: any) => [p.id, p]))
      const studentMapByNumber = Object.fromEntries(studentData.map((p: any) => [p.id_number, p]))
      
      data.forEach((appt: any) => {
        const student = (appt.patient?.user_id && studentMapById[appt.patient.user_id]) || 
                        (appt.patient?.id_number && studentMapByNumber[appt.patient.id_number])
        
        if (student) {
          appt.student_context = {
            photo_url: student.student?.[0]?.photo_url || null,
            photo_done: student.student?.[0]?.photo_done || false,
          }
        }
      })
    }
  }

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role, id_number').eq('id', user.id).single()
  if (profile?.role === 'PHARMACY') {
    return NextResponse.json({ error: 'Pharmacy role cannot create appointments' }, { status: 403 })
  }

  const body = await req.json()

  // For students: find their patient record via user_id or id_number
  let patientId = body.patient_id
  if (profile?.role === 'STUDENT') {
    // Try finding by user_id first
    let { data: pat } = await supabase
      .from('patients')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    // Fallback to id_number if not found by user_id
    if (!pat && profile.id_number) {
      const { data: patByNum } = await supabase
        .from('patients')
        .select('id')
        .ilike('id_number', profile.id_number)
        .maybeSingle()
      pat = patByNum
    }

    if (!pat) {
      return NextResponse.json({ 
        error: `No patient record found for your account (ID: ${profile.id_number ?? 'N/A'}). Please contact the administrator.` 
      }, { status: 404 })
    }
    patientId = pat.id
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      patient_id: patientId,
      requested_by: user.id,
      preferred_date: body.preferred_date,
      reason: body.reason,
      notes: body.notes,
      status: 'REQUESTED',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({ actor_id: user.id, action: 'CREATE', entity: 'appointments', entity_id: data.id })
  return NextResponse.json(data, { status: 201 })
}
