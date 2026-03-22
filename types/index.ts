// ─── Enums ─────────────────────────────────────────────────────────────────
export type UserRole = 'ADMIN' | 'RECEPTIONIST' | 'DOCTOR' | 'NURSE' | 'STUDENT' | 'PHARMACY'

export type AppointmentStatus =
  | 'REQUESTED'
  | 'PENDING'
  | 'CONFIRMED'
  | 'RESCHEDULED'
  | 'CANCELLED'
  | 'COMPLETED'

export type Gender = 'MALE' | 'FEMALE' | 'OTHER'

// ─── Database Row Types ─────────────────────────────────────────────────────
export interface Profile {
  id: string
  full_name: string
  email: string
  role: UserRole
  id_number: string | null   // matric / staff number
  photo_url: string | null
  is_verified: boolean
  created_at: string
}

export interface StudentProfile {
  id: string
  photo_url: string | null
  photo_done: boolean
  email_done: boolean
}

export interface Patient {
  id: string
  patient_id: string          // AUMC-YYYY-XXXX
  full_name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null
  gender: Gender | null
  address: string | null
  id_number: string | null
  created_by: string | null
  created_at: string
}

export interface Encounter {
  id: string
  patient_id: string
  doctor_id: string
  complaint: string | null
  history: string | null
  diagnosis: string | null
  treatment: string | null
  prescriptions: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  doctor?: Pick<Profile, 'full_name' | 'id_number'>
  patient?: Pick<Patient, 'full_name' | 'patient_id'>
}

export interface Appointment {
  id: string
  patient_id: string
  requested_by: string | null
  assigned_to: string | null
  preferred_date: string | null
  scheduled_at: string | null
  reason: string | null
  status: AppointmentStatus
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  patient?: Pick<Patient, 'full_name' | 'patient_id'>
  assignee?: Pick<Profile, 'full_name' | 'role'>
  requester?: Pick<Profile, 'full_name' | 'role'>
}

export interface AuditLog {
  id: string
  actor_id: string | null
  action: string
  entity: string
  entity_id: string | null
  metadata: Record<string, unknown> | null
  created_at: string
}

// ─── Report Types ──────────────────────────────────────────────────────────
export interface DashboardReport {
  daily_appointments: number
  total_patients: number
  recent_encounters: Encounter[]
  appointments_by_status: { status: AppointmentStatus; count: number }[]
}

// ─── API Payload Types ─────────────────────────────────────────────────────
export interface CreatePatientPayload {
  full_name: string
  email?: string
  phone?: string
  date_of_birth?: string
  gender?: Gender
  address?: string
  id_number?: string
}

export interface CreateEncounterPayload {
  patient_id: string
  complaint?: string
  history?: string
  diagnosis?: string
  treatment?: string
  prescriptions?: string
  notes?: string
}

export interface CreateAppointmentPayload {
  patient_id: string
  preferred_date?: string
  reason?: string
  assigned_to?: string
}

export interface UpdateAppointmentPayload {
  status?: AppointmentStatus
  scheduled_at?: string
  assigned_to?: string
  notes?: string
}
