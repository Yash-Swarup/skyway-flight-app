import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import type { User, Session } from '@supabase/supabase-js'
import type { Booking } from '@/types'

interface UserState {
  user: User | null
  session: Session | null
  cachedBookings: Booking[]

  setUser: (user: User | null) => void
  setSession: (session: Session | null) => void
  setCachedBookings: (bookings: Booking[]) => void
  clearUser: () => void
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      cachedBookings: [],

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setCachedBookings: (bookings) => set({ cachedBookings: bookings }),
      clearUser: () => set({ user: null, session: null, cachedBookings: [] }),
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist session token + cached bookings (no sensitive user PII)
      partialize: (state) => ({
        session: state.session
          ? { access_token: state.session.access_token, refresh_token: state.session.refresh_token }
          : null,
        cachedBookings: state.cachedBookings,
      }),
    }
  )
)
