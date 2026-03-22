import { Metadata } from 'next'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { AppointmentForm } from '@/components/appointments/AppointmentForm'

export const metadata: Metadata = { title: 'New Appointment | SMARTMED' }

interface Props {
  searchParams: Promise<{ patient_id?: string }>
}

export default async function NewAppointmentPage({ searchParams }: Props) {
  const params = await searchParams
  return (
    <div>
      <DashboardHeader
        title="Request Appointment"
        subtitle="Submit a new appointment request to the medical center"
      />
      <div className="p-6 max-w-2xl">
        <AppointmentForm patientId={params.patient_id} mode="request" />
      </div>
    </div>
  )
}
