import { Metadata } from 'next'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { EncounterForm } from '@/components/encounters/EncounterForm'

export const metadata: Metadata = { title: 'New Encounter | SMARTMED' }

interface Props {
  searchParams: Promise<{ patient_id?: string; name?: string }>
}

export default async function NewEncounterPage({ searchParams }: Props) {
  const params = await searchParams
  return (
    <div>
      <DashboardHeader
        title="Create Encounter Record"
        subtitle="Document patient clinical assessment"
      />
      <div className="p-6 max-w-3xl">
        <EncounterForm
          patientId={params.patient_id}
          patientName={params.name ? decodeURIComponent(params.name) : undefined}
        />
      </div>
    </div>
  )
}
