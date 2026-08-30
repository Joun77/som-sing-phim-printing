import React, { useEffect, useState } from 'react'
import { useShop } from '../context/ShopContext.tsx'
import { X } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPromptBanner() {
  const { language } = useShop()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    // Check if already dismissed in session
    if (sessionStorage.getItem('ssp_pwa_dismissed') === 'true') {
      return
    }

    // iOS Detection
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone

    if (isIosDevice && !isStandalone) {
      setIsIOS(true)
      setShowBanner(true)
      return
    }

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowBanner(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setDismissed(true)
    sessionStorage.setItem('ssp_pwa_dismissed', 'true')
  }

  if (!showBanner || dismissed) return null

  return (
    <aside className="luxury-pwa-banner" aria-label="Install Som-Sing Phim App">
      <div className="luxury-pwa-content">
        <div className="luxury-pwa-icon" aria-hidden="true">
          SSP
        </div>
        <div className="luxury-pwa-text">
          <h4 className="luxury-pwa-title">
            {language === 'lo' ? 'ຕິດຕັ້ງແອັບ ສົມສິ່ງພິມ (Web App)' : 'Install Som-Sing Phim Atelier'}
          </h4>
          <p className="luxury-pwa-desc">
            {isIOS
              ? (language === 'lo'
                  ? 'ກົດປຸ່ມ Share (ແບ່ງປັນ) ແລ້ວເລືອກ "Add to Home Screen"'
                  : 'Tap Share icon and select "Add to Home Screen" for instant access')
              : (language === 'lo'
                  ? 'ເພີ່ມໃສ່ໜ້າຈໍຫຼັກເພື່ອຕິດຕາມງານພິມແບບ Real-time ແລະ ປະສົບການເຕັມຈໍ'
                  : 'Add to home screen for real-time tracking & standalone luxury atelier access')}
          </p>
        </div>
        <div className="luxury-pwa-actions">
          {!isIOS && deferredPrompt && (
            <button type="button" onClick={handleInstallClick} className="luxury-pwa-btn-primary">
              {language === 'lo' ? 'ຕິດຕັ້ງທັນທີ' : 'Install'}
            </button>
          )}
          <button type="button" onClick={handleDismiss} className="luxury-pwa-btn-close flex items-center justify-center" aria-label="Dismiss">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
