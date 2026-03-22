import Link from 'next/link'
import { User, Phone, Mail, Calendar, IdCard, ArrowRight } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'
import type { Patient } from '@/types'
import { format } from 'date-fns'

export function PatientCard({ patient }: { patient: Patient }) {
  return (
    <Link href={`/patients/${patient.id}`}>
      <Card className="hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-semibold text-foreground truncate">{patient.full_name}</h3>
                <Badge variant="outline" className="text-[10px] font-mono shrink-0">
                  {patient.patient_id}
                </Badge>
                {patient.gender && (
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {patient.gender}
                  </Badge>
                )}
              </div>
              <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                {patient.id_number && (
                  <span className="helper-text flex items-center gap-1">
                    <IdCard className="h-3 w-3" /> {patient.id_number}
                  </span>
                )}
                {patient.email && (
                  <span className="helper-text flex items-center gap-1">
                    <Mail className="h-3 w-3" /> {patient.email}
                  </span>
                )}
                {patient.phone && (
                  <span className="helper-text flex items-center gap-1">
                    <Phone className="h-3 w-3" /> {patient.phone}
                  </span>
                )}
                {patient.date_of_birth && (
                  <span className="helper-text flex items-center gap-1">
                    <Calendar className="h-3 w-3" />{' '}
                    {format(new Date(patient.date_of_birth), 'dd MMM yyyy')}
                  </span>
                )}
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
