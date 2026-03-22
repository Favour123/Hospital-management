import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase/server'
import { logAudit } from '@/lib/utils/auditLog'

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: enc } = await supabase.from('encounters').select('doctor_id, created_at').eq('id', id).single()
  if (!enc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()

  // Only doctor who created (within 24h) or admin can update
  const isOwner = enc.doctor_id === user.id
  const within24h = new Date(enc.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
  const isAdmin = profile?.role === 'ADMIN'

  if (!isAdmin && !(isOwner && within24h)) {
    return NextResponse.json({ error: 'Edit window expired (24 hours)' }, { status: 403 })
  }

  const body = await req.json()
  const { data, error } = await supabase.from('encounters').update(body).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await logAudit({ actor_id: user.id, action: 'UPDATE', entity: 'encounters', entity_id: id })
  return NextResponse.json(data)
}
