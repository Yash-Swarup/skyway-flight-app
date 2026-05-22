'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plane, BookOpen, LogOut, LogIn, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserStore } from '@/stores/userStore'

export function Navbar() {
  const { user } = useUserStore()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    setMobileOpen(false)
  }

  return (
    <nav style={{
      background: 'rgba(10,14,26,0.9)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid rgba(56,189,248,0.12)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}>
            <div style={{
              background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
              borderRadius: 10,
              padding: '6px 8px',
              display: 'flex',
              alignItems: 'center',
            }}>
              <Plane size={18} color="white" />
            </div>
            <span style={{
              fontFamily: "'Space Mono', monospace",
              fontWeight: 700,
              fontSize: '1.1rem',
              color: '#f1f5f9',
              letterSpacing: '-0.02em',
            }}>
              Sky<span style={{ color: '#38bdf8' }}>Way</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} className="hidden-mobile">
            {user ? (
              <>
                <NavLink href="/bookings" icon={<BookOpen size={16} />}>My Bookings</NavLink>
                <button onClick={handleLogout} className="nav-btn-danger">
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <>
                <NavLink href="/auth/login" icon={<LogIn size={16} />}>Login</NavLink>
                <Link href="/auth/register" style={{
                  background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
                  color: 'white',
                  padding: '8px 18px',
                  borderRadius: 10,
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  Sign Up
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 4 }}
            className="show-mobile"
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div style={{
            borderTop: '1px solid rgba(56,189,248,0.1)',
            paddingBottom: '1rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
          }}>
            {user ? (
              <>
                <MobileNavLink href="/bookings" onClick={() => setMobileOpen(false)}>My Bookings</MobileNavLink>
                <button onClick={handleLogout} style={{
                  background: 'none', border: 'none', color: '#ef4444',
                  padding: '10px 0', textAlign: 'left', cursor: 'pointer', fontSize: '0.9rem',
                }}>Logout</button>
              </>
            ) : (
              <>
                <MobileNavLink href="/auth/login" onClick={() => setMobileOpen(false)}>Login</MobileNavLink>
                <MobileNavLink href="/auth/register" onClick={() => setMobileOpen(false)}>Sign Up</MobileNavLink>
              </>
            )}
          </div>
        )}
      </div>

      <style>{`
        @media (min-width: 640px) {
          .hidden-mobile { display: flex !important; }
          .show-mobile { display: none !important; }
        }
        @media (max-width: 639px) {
          .hidden-mobile { display: none !important; }
          .show-mobile { display: block !important; }
        }
        .nav-btn-danger {
          background: none; border: 1px solid rgba(239,68,68,0.3);
          color: #ef4444; padding: 7px 14px; border-radius: 8px;
          cursor: pointer; font-size: 0.875rem; display: flex; align-items: center; gap: 6px;
          transition: all 0.2s;
        }
        .nav-btn-danger:hover { background: rgba(239,68,68,0.1); }
      `}</style>
    </nav>
  )
}

function NavLink({ href, icon, children }: { href: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link href={href} style={{
      display: 'flex', alignItems: 'center', gap: '6px',
      color: '#94a3b8', textDecoration: 'none', padding: '8px 12px',
      borderRadius: 8, fontSize: '0.875rem', transition: 'color 0.2s',
    }}
      onMouseEnter={e => (e.currentTarget.style.color = '#f1f5f9')}
      onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
    >
      {icon}{children}
    </Link>
  )
}

function MobileNavLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link href={href} onClick={onClick} style={{
      color: '#94a3b8', textDecoration: 'none', padding: '10px 0',
      fontSize: '0.9rem', borderBottom: '1px solid rgba(255,255,255,0.05)',
    }}>
      {children}
    </Link>
  )
}
