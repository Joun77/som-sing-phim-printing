import React, { useEffect, useState } from 'react'
import { useShop } from '../context/ShopContext.tsx'
import { X, Download, Share2, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPromptBanner() {
  const { language } = useShop()
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [showIosGuide, setShowIosGuide] = useState(false)
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

  // Sync body class so floating VIP button automatically adjusts height without collision
  useEffect(() => {
    if (showBanner && !dismissed) {
      document.body.classList.add('has-pwa-banner')
    } else {
      document.body.classList.remove('has-pwa-banner')
    }
    return () => {
      document.body.classList.remove('has-pwa-banner')
    }
  }, [showBanner, dismissed])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setShowBanner(false)
      }
      setDeferredPrompt(null)
    } else {
      // Fallback instruction
      alert(language === 'lo' 
        ? 'ກະລຸນາກົດປຸ່ມເມນູ (3 ຈຸດ) ໃນ Browser ແລ້ວເລືອກ "Install App" ຫຼື "Add to Home Screen"'
        : 'Please tap browser menu (3 dots) and select "Install app" or "Add to Home screen"')
    }
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setDismissed(true)
    document.body.classList.remove('has-pwa-banner')
    sessionStorage.setItem('ssp_pwa_dismissed', 'true')
  }

  if (!showBanner || dismissed) return null

  const isLao = language === 'lo'

  return (
    <aside className="luxury-pwa-banner" aria-label="Install Som-Sing Phim App">
      {/* iOS Step-by-Step Tooltip */}
      {isIOS && showIosGuide && (
        <div className="luxury-pwa-ios-guide">
          <div className="flex items-center justify-between pb-1.5 border-b border-amber-200/80">
            <span className="font-extrabold text-[#0B1938] text-xs flex items-center gap-1.5">
              <Share2 className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>{isLao ? 'ວິທີຕິດຕັ້ງແອັບເທິງ iPhone / iPad' : 'How to Install on iPhone / iPad'}</span>
            </span>
            <button
              type="button"
              onClick={() => setShowIosGuide(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <ol className="text-xs text-slate-700 font-medium space-y-1 mt-2">
            <li>
              1. ກົດປຸ່ມ <strong>Share (ແບ່ງປັນ)</strong> <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-bold">⎋</span> ຢູ່ແຖບລຸ່ມຂອງ Safari
            </li>
            <li>
              2. ເລື່ອນລົງແລ້ວເລືອກ <strong>"Add to Home Screen (ເພີ່ມໃສ່ໜ້າຈໍຫຼັກ)"</strong>
            </li>
            <li>
              3. ກົດ <strong>"Add (ເພີ່ມ)"</strong> ມຸມຂວາເທິງ ເພື່ອເຂົ້າໃຊ້ງານແບບເຕັມຈໍ
            </li>
          </ol>
        </div>
      )}

      <div className="luxury-pwa-inner">
        <div className="luxury-pwa-icon" aria-hidden="true">
          SSP
        </div>
        <div className="luxury-pwa-content">
          <h4 className="luxury-pwa-title">
            {isLao ? 'ຕິດຕັ້ງແອັບ ສົມສິ່ງພິມ' : 'Install Som-Sing Phim App'}
          </h4>
          <p className="luxury-pwa-desc">
            {isIOS
              ? (isLao
                  ? 'ກົດ Share ແລ້ວເລືອກ "Add to Home Screen" ເພື່ອໃຊ້ງານເຕັມຈໍ'
                  : 'Tap Share and select "Add to Home Screen" for instant access')
              : (isLao
                  ? 'ເພີ່ມໃສ່ໜ້າຈໍຫຼັກເພື່ອຕິດຕາມງານພິມ ແລະ ປະສົບການເຕັມຈໍ'
                  : 'Add to home screen for real-time tracking & full-screen experience')}
          </p>
        </div>
        <div className="luxury-pwa-actions">
          {isIOS ? (
            <button
              type="button"
              onClick={() => setShowIosGuide(!showIosGuide)}
              className="luxury-pwa-btn-ios"
              title="ເບິ່ງວິທີຕິດຕັ້ງ"
            >
              <Share2 className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>{isLao ? 'ວິທີຕິດຕັ້ງ' : 'How to'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleInstallClick}
              className="luxury-pwa-btn-primary"
            >
              <Download className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>{isLao ? 'ຕິດຕັ້ງແອັບ' : 'Install'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            className="luxury-pwa-btn-close"
            aria-label="Dismiss"
            title="ປິດ"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
