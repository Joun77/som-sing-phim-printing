import React, { useEffect, useState } from 'react'
import { useShop } from '../context/ShopContext.tsx'

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

    // Check if running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    if (isStandalone) {
      return
    }

    // Check iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream
    setIsIOS(isIosDevice)

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    if (isIosDevice && !isStandalone) {
      // Show iOS instruction banner after slight delay
      const timer = setTimeout(() => setShowBanner(true), 3000)
      return () => clearTimeout(timer)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    await deferredPrompt.prompt()
    const choice = await deferredPrompt.userChoice
    if (choice.outcome === 'accepted') {
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
    <aside className="luxury-pwa-banner" role="region" aria-label="Install Som Sing Phim App">
      <div className="luxury-pwa-inner">
        <div className="luxury-pwa-icon">
          <img src="/icons/icon-192.png" alt="App Icon" width="42" height="42" />
        </div>
        <div className="luxury-pwa-content">
          <h4>{language === 'lo' ? 'ຕິດຕັ້ງ ແອັບ Som Sing Phim' : 'Install Som Sing Phim App'}</h4>
          <p>
            {isIOS
              ? (language === 'lo'
                  ? 'ກົດປຸ່ມ Share (ແບ່ງປັນ) ແລ້ວເລືອກ "Add to Home Screen (ເພີ່ມໃສ່ໜ້າຈໍໂຮມ)" ເພື່ອຕິດຕາມສະຖານະວ່ອງໄວ'
                  : 'Tap the Share icon & select "Add to Home Screen" for instant tracking and full luxury experience')
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
          <button type="button" onClick={handleDismiss} className="luxury-pwa-btn-close" aria-label="Dismiss">
            ✕
          </button>
        </div>
      </div>
    </aside>
  )
}
