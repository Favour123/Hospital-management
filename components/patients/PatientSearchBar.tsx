'use client'

import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface PatientSearchBarProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export function PatientSearchBar({ value, onChange, placeholder = 'Search by name, ID, email, phone, or matric…' }: PatientSearchBarProps) {
  return (
    <div className="relative flex items-center max-w-lg w-full">
      <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-9"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
