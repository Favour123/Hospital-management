import type { UserRole } from '@/types'

// ─── Role Permissions ──────────────────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  ADMIN: [
    'patients:read', 'patients:write',
    'encounters:read', 'encounters:write',
    'appointments:read', 'appointments:write', 'appointments:manage',
    'reports:read',
    'admin:access',
    'audit:read',
  ],
  RECEPTIONIST: [
    'patients:read', 'patients:write',
    'appointments:read', 'appointments:write', 'appointments:manage',
  ],
  DOCTOR: [
    'patients:read',
    'encounters:read', 'encounters:write',
    'appointments:read', 'appointments:own',
  ],
  NURSE: [
    'patients:read',
    'encounters:read',
    'appointments:read', 'appointments:own',
  ],
  STUDENT: [
    'appointments:request', 'appointments:own-history',
  ],
  PHARMACY: [],
}

export function hasPermission(role: UserRole, permission: string): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

// ─── Route Access Map ──────────────────────────────────────────────────────
export const ROLE_DASHBOARD: Record<UserRole, string> = {
  ADMIN: '/dashboard/admin',
  RECEPTIONIST: '/dashboard/receptionist',
  DOCTOR: '/dashboard/doctor',
  NURSE: '/dashboard/nurse',
  STUDENT: '/dashboard/student',
  PHARMACY: '/auth/login',
}

// Routes allowed per role (prefix-based)
export const ROLE_ALLOWED_PREFIXES: Record<UserRole, string[]> = {
  ADMIN: ['/dashboard/admin', '/patients', '/encounters', '/appointments', '/api'],
  RECEPTIONIST: ['/dashboard/receptionist', '/patients', '/appointments', '/api'],
  DOCTOR: ['/dashboard/doctor', '/patients', '/encounters', '/appointments', '/api'],
  NURSE: ['/dashboard/nurse', '/patients', '/appointments', '/api'],
  STUDENT: ['/dashboard/student', '/appointments/new', '/appointments', '/api'],
  PHARMACY: [],
}

export function canAccessRoute(role: UserRole, pathname: string): boolean {
  const allowed = ROLE_ALLOWED_PREFIXES[role] ?? []
  return allowed.some((prefix) => pathname.startsWith(prefix))
}
