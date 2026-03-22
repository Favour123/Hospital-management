'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { MoreHorizontal, CheckCircle, XCircle, Clock, RefreshCw, User, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { StatusBadge } from './StatusBadge'
import type { Appointment, AppointmentStatus, UserRole } from '@/types'

interface AppointmentTableProps {
  appointments: Appointment[]
  userRole: UserRole
  onStatusChange?: (id: string, status: AppointmentStatus) => void
}

export function AppointmentTable({ appointments, userRole, onStatusChange }: AppointmentTableProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const canManage = ['ADMIN', 'RECEPTIONIST'].includes(userRole)

  async function handleStatus(id: string, status: AppointmentStatus) {
    setLoadingId(id)
    const res = await fetch(`/api/appointments/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const json = await res.json()
    setLoadingId(null)
    if (!res.ok) { toast.error(json.error ?? 'Update failed'); return }
    toast.success(`Appointment ${status.toLowerCase()}`)
    onStatusChange?.(id, status)
  }

  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Patient</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead>Preferred Date</TableHead>
            <TableHead>Scheduled</TableHead>
            <TableHead>Assigned To</TableHead>
            <TableHead>Status</TableHead>
            {canManage && <TableHead className="w-10" />}
          </TableRow>
        </TableHeader>
        <TableBody>
          {appointments.length === 0 && (
            <TableRow>
              <TableCell colSpan={canManage ? 7 : 6} className="text-center py-16 text-muted-foreground">
                No appointments found
              </TableCell>
            </TableRow>
          )}
          {appointments.map((appt) => {
            // @ts-ignore - added dynamically in API
            const student = appt.student_context
            const initials = appt.patient?.full_name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() ?? 'P'

            return (
              <TableRow key={appt.id} className={loadingId === appt.id ? 'opacity-50 transition-opacity' : ''}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8 border border-muted-foreground/10 shadow-sm">
                      <AvatarImage src={student?.photo_url ?? undefined} />
                      <AvatarFallback className="text-[10px] bg-primary/5 text-primary font-bold">{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-sm leading-tight">{appt.patient?.full_name ?? '—'}</p>
                      {appt.patient?.patient_id && (
                        <p className="text-[10px] text-muted-foreground font-mono mt-0.5 tracking-tighter uppercase">{appt.patient.patient_id}</p>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="max-w-[180px] truncate text-sm text-foreground/80">{appt.reason ?? '—'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3 w-3 opacity-60" />
                    {appt.preferred_date
                      ? format(new Date(appt.preferred_date), 'dd MMM, HH:mm')
                      : '—'}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3 opacity-60" />
                    {appt.scheduled_at
                      ? format(new Date(appt.scheduled_at), 'dd MMM, HH:mm')
                      : <span className="text-[10px] italic">Not yet set</span>}
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {appt.assignee?.full_name ? (
                    <div className="flex items-center gap-1.5">
                      <User className="h-3 w-3 text-primary" />
                      <span className="font-medium">Dr. {appt.assignee.full_name.split(' ')[0]}</span>
                    </div>
                  ) : <span className="text-xs text-muted-foreground/60 italic">Waiting...</span>}
                </TableCell>
                <TableCell><StatusBadge status={appt.status} /></TableCell>
                {canManage && (
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={!!loadingId}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatus(appt.id, 'CONFIRMED')}>
                          <CheckCircle className="h-4 w-4 text-green-600" /> Confirm
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatus(appt.id, 'PENDING')}>
                          <Clock className="h-4 w-4 text-amber-600" /> Mark Pending
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatus(appt.id, 'RESCHEDULED')}>
                          <RefreshCw className="h-4 w-4 text-blue-600" /> Reschedule
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatus(appt.id, 'COMPLETED')}>
                          <CheckCircle className="h-4 w-4 text-primary" /> Mark Completed
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleStatus(appt.id, 'CANCELLED')}
                          className="text-destructive focus:text-destructive"
                        >
                          <XCircle className="h-4 w-4" /> Cancel
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
