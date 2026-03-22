import { toast } from 'sonner'

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export async function resolvePatientId(pid: string): Promise<{ id: string; name: string } | null> {
  if (!pid) return null
  if (UUID_REGEX.test(pid)) return { id: pid, name: '' } // Name unknown if only UUID passed without context

  try {
    const res = await fetch(`/api/patients?q=${encodeURIComponent(pid)}`)
    if (!res.ok) throw new Error('Search failed')
    const patients = await res.json()

    if (patients.length === 0) {
      toast.error('No patient found with that ID or ID number')
      return null
    }

    if (patients.length > 1) {
      toast.error('Multiple patients found. Please be more specific (e.g. use full ID No)')
      return null
    }

    return { id: patients[0].id, name: patients[0].full_name }
  } catch (err) {
    toast.error('Error finding patient')
    return null
  }
}
