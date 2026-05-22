'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plane, Mail, Lock, LogIn, AlertCircle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    const params = new URLSearchParams(window.location.search)
    router.push(params.get('redirect') ?? '/')
    router.refresh()
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(15,23,42,0.8)',
    border: '1px solid rgba(56,189,248,0.15)',
    borderRadius: 10,
    color: '#f1f5f9',
    padding: '12px 14px 12px 42px',
    fontSize: '0.9rem',
    outline: 'none',
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '2rem 1.5rem',
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 56, height: 56,
            background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
            borderRadius: 14, marginBottom: '1rem',
          }}>
            <Plane size={28} color="white" />
          </div>
          <h1 style={{ fontFamily: "'Space Mono', monospace", fontSize: '1.5rem', fontWeight: 700 }}>
            Welcome back
          </h1>
          <p style={{ color: '#64748b', marginTop: 6, fontSize: '0.875rem' }}>
            Sign in to manage your flights
          </p>
        </div>

        <div className="glass" style={{ padding: '2rem' }}>
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, padding: '0.75rem 1rem',
              display: 'flex', alignItems: 'center', gap: 8,
              color: '#ef4444', fontSize: '0.875rem', marginBottom: '1.25rem',
            }}>
              <AlertCircle size={15} />{error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="email"
                  style={inputStyle}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                <input
                  type="password"
                  style={inputStyle}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%',
              background: loading ? '#1e293b' : 'linear-gradient(135deg, #38bdf8, #0284c7)',
              border: 'none', borderRadius: 10,
              color: loading ? '#64748b' : 'white',
              padding: '13px',
              fontSize: '0.9rem', fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s',
            }}>
              <LogIn size={16} />
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: '#64748b' }}>
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 500 }}>
              Sign up
            </Link>
          </div>

          {/* Test credentials hint */}
          <div style={{
            marginTop: '1.5rem',
            padding: '0.75rem 1rem',
            background: 'rgba(56,189,248,0.05)',
            border: '1px dashed rgba(56,189,248,0.2)',
            borderRadius: 8, fontSize: '0.78rem', color: '#64748b',
          }}>
            <div style={{ marginBottom: 4, color: '#94a3b8', fontWeight: 500 }}>Test credentials</div>
            test@skyway.dev / skyway123
          </div>
        </div>
      </div>
    </div>
  )
}
