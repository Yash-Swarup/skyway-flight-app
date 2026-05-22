'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Plane, Mail, Lock, UserPlus, AlertCircle, CheckCircle } from 'lucide-react'

export default function RegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/` },
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => router.push('/auth/login'), 3000)
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
            Create account
          </h1>
          <p style={{ color: '#64748b', marginTop: 6, fontSize: '0.875rem' }}>
            Join SkyWay to start booking flights
          </p>
        </div>

        <div className="glass" style={{ padding: '2rem' }}>
          {success ? (
            <div style={{
              textAlign: 'center', padding: '1rem',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
            }}>
              <CheckCircle size={48} color="#22c55e" />
              <h3 style={{ fontWeight: 600 }}>Account created!</h3>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
                Check your email to confirm your account. Redirecting to login…
              </p>
            </div>
          ) : (
            <>
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

              <form onSubmit={handleRegister}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={16} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color="#64748b" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)' }} />
                    <input type="password" style={inputStyle} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min. 6 characters" required minLength={6} autoComplete="new-password" />
                  </div>
                </div>

                <button type="submit" disabled={loading} style={{
                  width: '100%',
                  background: loading ? '#1e293b' : 'linear-gradient(135deg, #38bdf8, #0284c7)',
                  border: 'none', borderRadius: 10,
                  color: loading ? '#64748b' : 'white',
                  padding: '13px', fontSize: '0.9rem', fontWeight: 600,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <UserPlus size={16} />{loading ? 'Creating account...' : 'Create Account'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '1.25rem', fontSize: '0.875rem', color: '#64748b' }}>
                Already have an account?{' '}
                <Link href="/auth/login" style={{ color: '#38bdf8', textDecoration: 'none', fontWeight: 500 }}>Sign in</Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
