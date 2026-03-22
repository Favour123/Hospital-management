import Link from 'next/link'
import { MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function VerifyPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-6">
        {/* Card */}
        <div className="bg-card border border-border rounded-xl p-10 shadow-sm flex flex-col items-center text-center space-y-5">
          <div className="flex items-center justify-center w-16 h-16 rounded-full bg-accent">
            <MailCheck className="w-8 h-8 text-primary" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">Check your email</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              We sent a confirmation link to your email address.
              <br />
              Click the link to activate your SMARTMED account.
            </p>
          </div>

          <div className="w-full rounded-lg bg-accent/60 border border-border px-4 py-3 text-sm text-muted-foreground">
            Didn&apos;t receive the email? Check your spam folder or wait a few minutes.
          </div>

          <Button asChild variant="outline" className="w-full">
            <Link href="/auth/login">Back to Sign In</Link>
          </Button>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Adeleke University Medical Center. All rights reserved.
        </p>
      </div>
    </main>
  )
}
