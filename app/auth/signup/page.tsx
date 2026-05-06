import { Metadata } from 'next'
import { SignupForm } from '@/components/auth/SignupForm'
import { UserPlus } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = { title: 'Create Account' }

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex h-16 w-16 rounded-full bg-primary items-center justify-center mb-4 text-primary-foreground font-black text-lg">
            AU
          </div>
          <h1 className="text-2xl font-bold text-foreground flex items-center justify-center gap-2">
            <UserPlus className="h-6 w-6 text-primary" />
            Create Account
          </h1>
          <p className="text-muted-foreground mt-1">
            Register for the Medical Portal
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-card border border-border rounded-xl p-8 shadow-sm">
          <SignupForm />
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          © {new Date().getFullYear()} Adeleke University Medical Center. All rights reserved.
        </p>
      </div>
    </div>
  )
}
