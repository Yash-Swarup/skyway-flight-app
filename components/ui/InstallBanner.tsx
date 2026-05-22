'use client'

import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem('pwa-banner-dismissed')) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShow(false)
    setDismissed(true)
    sessionStorage.setItem('pwa-banner-dismissed', '1')
  }

  if (!show || dismissed) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 200,
      width: 'calc(100% - 3rem)',
      maxWidth: 480,
      background: 'rgba(15,23,42,0.95)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(56,189,248,0.3)',
      borderRadius: 14,
      padding: '1rem 1.25rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
      animation: 'fadeUp 0.3s ease forwards',
    }}>
      <div style={{
        width: 40, height: 40, flexShrink: 0,
        background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
        borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Download size={18} color="white" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 2 }}>
          Install SkyWay
        </div>
        <div style={{ color: '#64748b', fontSize: '0.78rem', lineHeight: 1.4 }}>
          Add to home screen for offline access & faster loading
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <button
          onClick={handleInstall}
          style={{
            background: 'linear-gradient(135deg, #38bdf8, #0284c7)',
            border: 'none', borderRadius: 8,
            color: 'white', padding: '7px 14px',
            fontSize: '0.8rem', fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          style={{
            background: 'none',
            border: '1px solid rgba(56,189,248,0.2)',
            borderRadius: 8, color: '#64748b',
            width: 32, height: 32,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', flexShrink: 0,
          }}
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
