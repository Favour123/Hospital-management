import { createServerClient } from '@/lib/supabase/server'

interface AuditLogPayload {
  actor_id: string
  action: string
  entity: string
  entity_id?: string
  metadata?: Record<string, unknown>
}

export async function logAudit(payload: AuditLogPayload) {
  const supabase = await createServerClient()
  const { error } = await supabase.from('audit_logs').insert({
    actor_id: payload.actor_id,
    action: payload.action,
    entity: payload.entity,
    entity_id: payload.entity_id ?? null,
    metadata: payload.metadata ?? null,
  })
  if (error) {
    console.error('[AuditLog] Failed to write audit log:', error.message)
  }
}
