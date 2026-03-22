'use client'

import { create } from 'zustand'
import type { Profile, StudentProfile } from '@/types'

interface AuthState {
  profile: Profile | null
  studentProfile: StudentProfile | null
  isLoading: boolean
  setProfile: (profile: Profile | null) => void
  setStudentProfile: (sp: StudentProfile | null) => void
  setIsLoading: (v: boolean) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  studentProfile: null,
  isLoading: true,
  setProfile: (profile) => set({ profile }),
  setStudentProfile: (studentProfile) => set({ studentProfile }),
  setIsLoading: (isLoading) => set({ isLoading }),
  clearAuth: () => set({ profile: null, studentProfile: null, isLoading: false }),
}))


// jkfnrkjgnrjgnjrjgnognoigjoitjoitjoijgoitjgtoigjtoigjtgoijtoi