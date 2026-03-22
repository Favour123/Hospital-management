import { format } from 'date-fns'
import { Stethoscope, User, Clock, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import type { Encounter } from '@/types'

export function EncounterCard({ encounter }: { encounter: Encounter }) {
  // @ts-ignore - added dynamically in API
  const student = encounter.student_context

  return (
    <Card className="border-l-4 border-l-primary hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            {student?.photo_url ? (
              <Avatar className="h-8 w-8">
                <AvatarImage src={student.photo_url} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">ST</AvatarFallback>
              </Avatar>
            ) : (
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Stethoscope className="h-4 w-4 text-primary" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm">Clinical Encounter</span>
                {student?.photo_done && (
                  <Badge variant="secondary" className="text-[9px] h-4 bg-emerald-100 text-emerald-700 border-0">
                    <CheckCircle className="h-2 w-2 mr-0.5" /> Verified Profile
                  </Badge>
                )}
              </div>
              <p className="text-[10px] text-muted-foreground font-mono">
                Ref: {encounter.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/30 px-2 py-1 rounded-full">
            <Clock className="h-3 w-3" />
            {format(new Date(encounter.created_at), 'dd MMM yyyy, HH:mm')}
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2 pl-11">
          <User className="h-3 w-3" />
          <span className="font-medium">Dr. {encounter.doctor?.full_name ?? 'Medical Officer'}</span>
          {encounter.doctor?.id_number && (
            <Badge variant="outline" className="text-[10px] py-0">{encounter.doctor.id_number}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm pt-0 pl-11 ml-3">
        {encounter.complaint && (
          <div>
            <p className="helper-text font-semibold uppercase tracking-wide mb-1">Chief Complaint</p>
            <p className="text-foreground">{encounter.complaint}</p>
          </div>
        )}
        {encounter.diagnosis && (
          <>
            <Separator />
            <div>
              <p className="helper-text font-semibold uppercase tracking-wide mb-1">Diagnosis</p>
              <p className="text-foreground font-medium">{encounter.diagnosis}</p>
            </div>
          </>
        )}
        {encounter.treatment && (
          <>
            <Separator />
            <div>
              <p className="helper-text font-semibold uppercase tracking-wide mb-1">Treatment Plan</p>
              <p className="text-foreground">{encounter.treatment}</p>
            </div>
          </>
        )}
        {encounter.prescriptions && (
          <>
            <Separator />
            <div>
              <p className="helper-text font-semibold uppercase tracking-wide mb-1">Prescriptions</p>
              <p className="text-foreground whitespace-pre-line">{encounter.prescriptions}</p>
            </div>
          </>
        )}
        {encounter.notes && (
          <>
            <Separator />
            <div>
              <p className="helper-text font-semibold uppercase tracking-wide mb-1">Clinician Notes</p>
              <p className="text-foreground italic">{encounter.notes}</p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
