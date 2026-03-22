import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils/cn'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: LucideIcon
  trend?: { value: number; label: string }
  iconColor?: string
  iconBg?: string
  className?: string
}

export function StatsCard({
  title, value, subtitle, icon: Icon,
  trend, iconColor = 'text-primary', iconBg = 'bg-primary/10', className,
}: StatsCardProps) {
  return (
    <Card className={cn('stat-card border-0', className)}>
      <CardContent className="p-0 flex items-start gap-4">
        <div className={cn('flex-shrink-0 rounded-xl p-3', iconBg)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="helper-text">{title}</p>
          <p className="text-2xl font-bold text-foreground mt-0.5">{value}</p>
          {subtitle && <p className="helper-text mt-0.5">{subtitle}</p>}
          {trend && (
            <p className={cn(
              'text-xs font-medium mt-1',
              trend.value >= 0 ? 'text-green-600' : 'text-destructive',
            )}>
              {trend.value >= 0 ? '▲' : '▼'} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
