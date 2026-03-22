'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'

export default function ConfirmSuccessPage() {
  const router = useRouter()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          router.push('/auth/login')
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [router])

  const handleManualRedirect = () => {
    router.push('/auth/login')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      {/* Brand Header */}
      <div className="flex items-center gap-3 mb-12">
        <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center border-4 border-gold shadow-sm">
          <span className="text-sm font-black text-primary-foreground">AU</span>
        </div>
        <div>
          <p className="text-xl font-bold text-foreground">SMARTMED</p>
          <p className="text-xs text-muted-foreground">Adeleke University Medical Center</p>
        </div>
      </div>

      <Card className="w-full max-w-md border-primary/20 shadow-xl animate-in fade-in zoom-in duration-500">
        <CardHeader className="text-center pt-10 pb-2">
          <div className="mx-auto w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-6 ring-8 ring-success/5 animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">Email Confirmed!</CardTitle>
          <CardDescription className="text-muted-foreground mt-2">
            Your identity has been successfully verified.
          </CardDescription>
        </CardHeader>

        <CardContent className="text-center px-8 py-6">
          <p className="text-muted-foreground leading-relaxed">
            Welcome to SMARTMED. You can now access your medical records, appointments, and more. 
            We are redirecting you to your portal in <span className="font-bold text-primary tabular-nums">{countdown}s</span>...
          </p>
        </CardContent>

        <CardFooter className="flex flex-col gap-4 pb-10 px-8">
          <Button 
            className="w-full h-12 text-base font-semibold group bg-primary hover:bg-primary/90 transition-all shadow-md shadow-primary/20"
            onClick={handleManualRedirect}
          >
            Go to Dashboard
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="w-3 h-3" />
            <span>Secure Verification Powered by Supabase</span>
          </div>
        </CardFooter>
      </Card>

      <p className="mt-12 text-xs text-muted-foreground/60 text-center max-w-sm">
        Adeleke University Medical Center &copy; {new Date().getFullYear()} 
        <br />
        Computerized Medical Record Management System
      </p>
    </div>
  )
}
