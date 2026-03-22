import type { Metadata } from 'next'
import '@fontsource-variable/inter'
import './globals.css'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: 'SMARTMED | Adeleke University Medical Center',
  description:
    'Computerized Medical Record Management System for Adeleke University Medical Center',
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
