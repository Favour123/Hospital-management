import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/utils/auditLog'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['ADMIN', 'RECEPTIONIST'].includes(profile?.role ?? '')) {
    return NextResponse.json({ error: 'Forbidden: only admin/receptionist can update appointments' }, { status: 403 })
  }

  const body = await req.json()
  const { data, error } = await supabase
    .from('appointments')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    // Catch double-booking trigger error
    if (error.message.includes('Double-booking')) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  await logAudit({
    actor_id: user.id, action: 'UPDATE_STATUS', entity: 'appointments',
    entity_id: id, metadata: { status: body.status },
  })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only admin can delete appointments' }, { status: 403 })
  }

  const { error } = await supabase.from('appointments').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
