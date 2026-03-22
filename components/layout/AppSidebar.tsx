'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Users, FileText, Calendar, Settings,
  LogOut, ChevronLeft, ChevronRight, Stethoscope, ClipboardList,
  UserCheck, ShieldCheck, BarChart3, X, Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useAuthStore } from '@/stores/useAuthStore'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { UserRole } from '@/types'
import { useState } from 'react'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  roles: UserRole[]
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'STUDENT'] },
  { label: 'Patients', href: '/patients', icon: Users, roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE'] },
  { label: 'Encounters', href: '/encounters/new', icon: Stethoscope, roles: ['ADMIN', 'DOCTOR'] },
  { label: 'Appointments', href: '/appointments', icon: Calendar, roles: ['ADMIN', 'RECEPTIONIST', 'DOCTOR', 'NURSE', 'STUDENT'] },
  { label: 'Reports', href: '/reports', icon: BarChart3, roles: ['ADMIN'] as UserRole[] },
]

const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  RECEPTIONIST: 'Receptionist',
  DOCTOR: 'Doctor',
  NURSE: 'Nurse',
  STUDENT: 'Student',
  PHARMACY: 'Pharmacy',
}

const ROLE_COLORS: Record<UserRole, string> = {
  ADMIN: 'bg-red-100 text-red-700',
  RECEPTIONIST: 'bg-blue-100 text-blue-700',
  DOCTOR: 'bg-primary/10 text-primary',
  NURSE: 'bg-teal-100 text-teal-700',
  STUDENT: 'bg-gold/20 text-amber-800',
  PHARMACY: 'bg-purple-100 text-purple-700',
}

function getDashboardHref(role: UserRole) {
  const map: Record<UserRole, string> = {
    ADMIN: '/dashboard/admin', RECEPTIONIST: '/dashboard/receptionist',
    DOCTOR: '/dashboard/doctor', NURSE: '/dashboard/nurse',
    STUDENT: '/dashboard/student', PHARMACY: '/auth/login',
  }
  return map[role]
}

function getNavHref(item: NavItem, role: UserRole) {
  if (item.href === '/dashboard') return getDashboardHref(role)
  return item.href
}

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { profile, clearAuth } = useAuthStore()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const role = profile?.role as UserRole | undefined
  const visibleItems = role ? NAV_ITEMS.filter((i) => i.roles.includes(role)) : []

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    clearAuth()
    toast.success('Signed out successfully')
    router.push('/auth/login')
  }

  const initials = profile?.full_name
    ?.split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) ?? 'AU'

  const sidebarContent = (
    <div className={cn('flex h-full flex-col', collapsed ? 'w-16' : 'w-64')}>
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-sidebar-border">
        <div className="flex-shrink-0 h-9 w-9 rounded-full bg-gold flex items-center justify-center">
          <span className="text-xs font-black text-gold-foreground">AU</span>
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="text-xs font-bold text-sidebar-foreground leading-tight">SMARTMED</p>
            <p className="text-[10px] text-sidebar-foreground/60 leading-tight truncate">Adeleke University</p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="ml-auto hidden md:flex text-sidebar-foreground/60 hover:text-sidebar-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* ── Nav ── */}
      <ScrollArea className="flex-1 py-3">
        <nav className="px-2 space-y-1">
          {visibleItems.map((item) => {
            const href = role ? getNavHref(item, role) : item.href
            const isActive = pathname.startsWith(item.href === '/dashboard' ? '/dashboard' : item.href)
            return (
              <Link
                key={item.href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  collapsed && 'justify-center px-2',
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>
      </ScrollArea>

      {/* ── User Profile ── */}
      <div className="border-t border-sidebar-border p-3">
        {!collapsed ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.photo_url ?? undefined} />
                <AvatarFallback className="bg-sidebar-accent text-sidebar-accent-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-sidebar-foreground truncate">{profile?.full_name}</p>
                <p className="text-[10px] text-sidebar-foreground/60 truncate">{profile?.id_number}</p>
              </div>
            </div>
            {role && (
              <div className="px-2">
                <span className={cn('text-[10px] font-semibold rounded-full px-2 py-0.5', ROLE_COLORS[role])}>
                  {ROLE_LABELS[role]}
                </span>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="w-full justify-start text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent px-2"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>
        ) : (
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center rounded-lg p-2 text-sidebar-foreground/70 hover:bg-sidebar-accent"
          >
            <LogOut className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={cn(
        'hidden md:flex flex-col h-screen sticky top-0 bg-sidebar border-r border-sidebar-border transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
      )}>
        {sidebarContent}
      </aside>

      {/* Mobile trigger */}
      <button
        className="md:hidden fixed top-4 left-4 z-50 rounded-lg bg-primary p-2 text-primary-foreground shadow-lg"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative flex flex-col w-64 h-full bg-sidebar border-r border-sidebar-border">
            <button
              className="absolute top-4 right-4 text-sidebar-foreground/60 hover:text-sidebar-foreground"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  )
}
