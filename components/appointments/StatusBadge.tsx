import { Badge } from '@/components/ui/badge'
import type { AppointmentStatus } from '@/types'

const STATUS_CONFIG: Record<AppointmentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'gold' }> = {
  REQUESTED:   { label: 'Requested',   variant: 'outline' },
  PENDING:     { label: 'Pending',     variant: 'warning' },
  CONFIRMED:   { label: 'Confirmed',   variant: 'success' },
  RESCHEDULED: { label: 'Rescheduled', variant: 'info' },
  CANCELLED:   { label: 'Cancelled',   variant: 'destructive' },
  COMPLETED:   { label: 'Completed',   variant: 'secondary' },
}

export function StatusBadge({ status }: { status: AppointmentStatus }) {
  const config = STATUS_CONFIG[status]
  return <Badge variant={config.variant}>{config.label}</Badge>
}
