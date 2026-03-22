import Link from 'next/link'
import { format } from 'date-fns'
import { Stethoscope, ArrowRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import type { Encounter } from '@/types'

interface RecentEncountersListProps {
  encounters: Encounter[]
  loading?: boolean
}

export function RecentEncountersList({ encounters, loading }: RecentEncountersListProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <Stethoscope className="h-4 w-4 text-primary" />
          Recent Encounters
        </CardTitle>
        <Link href="/patients" className="text-xs text-primary hover:underline flex items-center gap-1">
          View all <ArrowRight className="h-3 w-3" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            ))
          : encounters.length === 0
            ? <p className="helper-text text-center py-4">No recent encounters</p>
            : encounters.map((enc) => (
                <Link
                  key={enc.id}
                  href={`/patients/${enc.patient_id}`}
                  className="flex items-start gap-3 rounded-lg p-2 hover:bg-muted/50 transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Stethoscope className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="label-text truncate">
                      {enc.patient?.full_name ?? 'Unknown Patient'}
                    </p>
                    <p className="helper-text truncate">{enc.diagnosis ?? enc.complaint ?? '—'}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-0.5">
                      {format(new Date(enc.created_at), 'dd MMM yyyy, HH:mm')}
                      {enc.doctor && ` · Dr. ${enc.doctor.full_name}`}
                    </p>
                  </div>
                </Link>
              ))}
      </CardContent>
    </Card>
  )
}
