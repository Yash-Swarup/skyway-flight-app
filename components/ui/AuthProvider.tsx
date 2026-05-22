'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'
import { useFlightStore } from '@/stores/flightStore'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setSession, clearUser } = useUserStore()
  const { resetAll } = useFlightStore()

  useEffect(() => {
    const supabase = createClient()

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (!session) {
        clearUser()
        resetAll()
      }
    })

    return () => subscription.unsubscribe()
  }, [setUser, setSession, clearUser, resetAll])

  return <>{children}</>
}
