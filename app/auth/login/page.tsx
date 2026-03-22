import { Metadata } from 'next'
import { LoginForm } from '@/components/auth/LoginForm'
import { ShieldCheck } from 'lucide-react'

export const metadata: Metadata = { title: 'Sign In | SMARTMED' }

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
            <span className="text-sm font-black text-primary-foreground">AU</span>
          </div>
          <div>
            <p className="text-xl font-bold text-sidebar-foreground">SMARTMED</p>
            <p className="text-xs text-sidebar-foreground/60">Adeleke University Medical Center</p>
          </div>
        </div>

        <div>
          <h2 className="text-4xl font-bold text-sidebar-foreground leading-tight text-balance">
            Computerized Medical Record Management System
          </h2>
          <p className="mt-4 text-sidebar-foreground/70 leading-relaxed">
            Secure, efficient, and reliable healthcare management for students and staff of
            Adeleke University, Ede, Osun State.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { label: 'Student Records', value: 'Secure' },
              { label: 'Appointments', value: 'Easy' },
              { label: 'Encounters', value: 'Digital' },
              { label: 'Reports', value: 'Instant' },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-sidebar-accent p-4">
                <p className="text-primary font-bold text-lg">{item.value}</p>
                <p className="text-sidebar-foreground/60 text-sm">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-xs text-sidebar-foreground/40">
          © {new Date().getFullYear()} Adeleke University Medical Center
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 flex-col items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
              <span className="text-sm font-black text-primary-foreground">AU</span>
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">SMARTMED</p>
              <p className="text-xs text-muted-foreground">Adeleke University Medical Center</p>
            </div>
          </div>

          <div className="flex items-center gap-2 mb-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Welcome back</h1>
          </div>
          <p className="text-muted-foreground mb-8">Sign in to access your medical portal</p>

          <LoginForm />
        </div>
      </div>
    </div>
  )
}
