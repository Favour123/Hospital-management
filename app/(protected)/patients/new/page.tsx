import { Metadata } from 'next'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { PatientForm } from '@/components/patients/PatientForm'

export const metadata: Metadata = { title: 'Register Patient | SMARTMED' }

export default function NewPatientPage() {
  return (
    <div>
      <DashboardHeader
        title="Register New Patient"
        subtitle="Create a new patient record in the system"
      />
      <div className="p-6 max-w-3xl">
        <PatientForm />
      </div>
    </div>
  )
}
