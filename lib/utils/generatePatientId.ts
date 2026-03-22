/**
 * Generates a unique Patient ID in the format AUMC-YYYY-XXXX
 * where YYYY is the current year and XXXX is a zero-padded sequential number.
 */
export function generatePatientId(sequenceNumber: number): string {
  const year = new Date().getFullYear()
  const padded = String(sequenceNumber).padStart(4, '0')
  return `AUMC-${year}-${padded}`
}

/**
 * Extracts the year from a Patient ID string.
 */
export function parsePatientId(patientId: string): { year: number; sequence: number } | null {
  const match = patientId.match(/^AUMC-(\d{4})-(\d{4})$/)
  if (!match) return null
  return { year: parseInt(match[1]), sequence: parseInt(match[2]) }
}
