'use client'

import { Bell, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuthStore } from '@/stores/useAuthStore'
import { cn } from '@/lib/utils/cn'

interface DashboardHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  showSearch?: boolean
  onSearch?: (q: string) => void
  className?: string
}

export function DashboardHeader({
  title,
  subtitle,
  actions,
  showSearch = false,
  onSearch,
  className,
}: DashboardHeaderProps) {
  const { profile } = useAuthStore()

  return (
    <header className={cn(
      'sticky top-0 z-40 flex items-center gap-4 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-4',
      className,
    )}>
      <div className="flex-1 min-w-0">
        <h1 className="page-title truncate">{title}</h1>
        {subtitle && <p className="helper-text mt-0.5">{subtitle}</p>}
      </div>

      {showSearch && (
        <div className="hidden sm:flex relative max-w-xs w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search…"
            className="pl-8"
            onChange={(e) => onSearch?.(e.target.value)}
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        {actions}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-gold" />
        </Button>
      </div>
    </header>
  )
}
