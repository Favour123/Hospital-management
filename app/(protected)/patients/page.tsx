'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Plus, UserPlus } from 'lucide-react'
import { DashboardHeader } from '@/components/layout/DashboardHeader'
import { PatientSearchBar } from '@/components/patients/PatientSearchBar'
import { PatientCard } from '@/components/patients/PatientCard'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthStore } from '@/stores/useAuthStore'
import { createClient } from '@/lib/supabase/client'
import type { Patient } from '@/types'

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const { profile } = useAuthStore()
  const canCreate = ['ADMIN', 'RECEPTIONIST'].includes(profile?.role ?? '')

  const load = useCallback(async (q: string) => {
    setLoading(true)
    const supabase = createClient()
    let builder = supabase.from('patients').select('*').order('created_at', { ascending: false })

    if (q.trim()) {
      builder = builder.or(
        `full_name.ilike.%${q}%,email.ilike.%${q}%,phone.ilike.%${q}%,patient_id.ilike.%${q}%,id_number.ilike.%${q}%`,
      )
    }

    const { data } = await builder.limit(50)
    setPatients((data as Patient[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const t = setTimeout(() => load(query), 300)
    return () => clearTimeout(t)
  }, [query, load])

  return (
    <div>
      <DashboardHeader
        title="Patient Records"
        subtitle="Search and manage patient information"
        actions={
          canCreate && (
            <Link href="/patients/new">
              <Button size="sm"><UserPlus className="h-4 w-4" /> Register Patient</Button>
            </Link>
          )
        }
      />

      <div className="p-6 space-y-4">
        <PatientSearchBar value={query} onChange={setQuery} />

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : patients.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-foreground">No patients found</p>
            <p className="helper-text mt-1">
              {query ? `No results for "${query}"` : 'No patients registered yet'}
            </p>
            {canCreate && (
              <Link href="/patients/new">
                <Button className="mt-4" size="sm"><UserPlus className="h-4 w-4" /> Register First Patient</Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-2">
            <p className="helper-text">{patients.length} patient{patients.length !== 1 ? 's' : ''} found</p>
            <div className="grid gap-2">
              {patients.map((p) => <PatientCard key={p.id} patient={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
