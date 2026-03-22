import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { generatePatientId } from '@/lib/utils/generatePatientId'
import { logAudit } from '@/lib/utils/auditLog'

export async function GET(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const q = url.searchParams.get('q')

  let query = supabase.from('patients').select('*').order('created_at', { ascending: false })
  if (q) {
    query = query.or(
      `full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,patient_id.ilike.%${q}%,id_number.ilike.%${q}%`,
    )
  }

  const { data, error } = await query.limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Check role
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['ADMIN', 'RECEPTIONIST'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()

  // Generate next patient ID
  const { count } = await supabase.from('patients').select('id', { count: 'exact', head: true })
  const seq = (count ?? 0) + 1
  const patient_id = generatePatientId(seq)

  const { data, error } = await supabase
    .from('patients')
    .insert({ ...body, patient_id, created_by: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({ actor_id: user.id, action: 'CREATE', entity: 'patients', entity_id: data.id, metadata: { patient_id } })
  return NextResponse.json(data, { status: 201 })
}
