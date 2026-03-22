import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/utils/auditLog'

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check user role
  const { data: profile } = await supabase.from('profiles').select('role, id_number').eq('id', user.id).single()
  
  const url = new URL(req.url)
  const patientId = url.searchParams.get('patient_id')

  let query = supabase
    .from('encounters')
    .select('*, doctor:profiles!doctor_id(full_name, id_number, role), patient:patients(full_name, patient_id, id_number)')
    .order('created_at', { ascending: false })

  // RLS might already handle this, but explicit filtering for students:
  if (profile?.role === 'STUDENT') {
    const { data: pat } = await supabase
      .from('patients')
      .select('id')
      .eq('id_number', profile.id_number ?? '')
      .single()
    
    if (!pat) return NextResponse.json([])
    query = query.eq('patient_id', pat.id)
  } else if (patientId) {
    query = query.eq('patient_id', patientId)
  }

  const { data, error } = await query.limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ─── Resolve Student Profiles (Dynamic Match via id_number) ───
  const idNumbers = data.map((enc: any) => enc.patient?.id_number).filter(Boolean)
  if (idNumbers.length > 0) {
    const { data: studentData } = await supabase
      .from('profiles')
      .select(`
        id_number, 
        role, 
        full_name,
        student:student_profiles(photo_url, photo_done, email_done)
      `)
      .in('id_number', idNumbers)
      .eq('role', 'STUDENT')

    if (studentData) {
      const studentMap = Object.fromEntries(studentData.map((p: any) => [p.id_number, p]))
      data.forEach((enc: any) => {
        if (enc.patient?.id_number) {
          const profile = studentMap[enc.patient.id_number]
          if (profile) {
            enc.student_context = {
              role: profile.role,
              photo_url: profile.student?.[0]?.photo_url || null,
              photo_done: profile.student?.[0]?.photo_done || false,
              email_done: profile.student?.[0]?.email_done || false,
            }
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

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['ADMIN', 'DOCTOR'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden: only doctors can create encounters' }, { status: 403 })
  }

  const body = await req.json()
  const { data, error } = await supabase
    .from('encounters')
    .insert({ ...body, doctor_id: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({
    actor_id: user.id, action: 'CREATE', entity: 'encounters',
    entity_id: data.id, metadata: { patient_id: body.patient_id },
  })
  return NextResponse.json(data, { status: 201 })
}
