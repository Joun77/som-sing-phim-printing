import React, { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useShop } from '../context/ShopContext.tsx'
import { WhatsAppIcon, SparkleIcon } from './icons.tsx'

export default function ConciergeDock() {
  const [isOpen, setIsOpen] = useState(false)
  const { language } = useShop()
  const location = useLocation()

  const isLao = language === 'lo'

  // Extract potential order ID / tracking from path
  const isTracking = location.pathname.startsWith('/track')
  const isCheckout = location.pathname.startsWith('/checkout')
  const isSuccess = location.pathname.startsWith('/success')

  const getContextMessage = () => {
    let base = isLao ? 'ສະບາຍດີ ທີມງານ ສົມສິ່ງພິມ, ຂ້າພະເຈົ້າຕ້ອງການປຶກສາເລື່ອງງານພິມ:' : 'Hello Som Sing Phim Concierge, I would like to consult about printing:'
    if (isTracking) {
      base += isLao ? ' (ສອບຖາມສະຖານະອໍເດີ)' : ' (Order Status Inquiry)'
    } else if (isSuccess) {
      base += isLao ? ` (ສອບຖາມຫຼັງສັ່ງຊື້ ${location.pathname})` : ` (Post-Order Inquiry ${location.pathname})`
    } else if (isCheckout) {
      base += isLao ? ' (ປຶກສາຂັ້ນຕອນການສັ່ງຊື້/ຊຳລະເງິນ)' : ' (Checkout / Payment Assistance)'
    }
    return encodeURIComponent(base)
  }

  const whatsappUrl = `https://wa.me/8562088888888?text=${getContextMessage()}`
  const lineUrl = `https://line.me/ti/p/~@somsingphim`

  return (
    <aside className={`luxury-concierge-dock ${isOpen ? 'is-open' : ''}`} aria-label="VIP Concierge">
      {isOpen && (
        <div className="concierge-popup">
          <div className="concierge-popup-header">
            <div className="concierge-status-indicator">
              <span className="pulse-dot" />
              <span>{isLao ? 'VIP Concierge Online' : 'VIP Concierge Online'}</span>
            </div>
            <button
              type="button"
              className="concierge-close-btn"
              onClick={() => setIsOpen(false)}
              aria-label="Close Concierge Menu"
            >
              ✕
            </button>
          </div>
          <div className="concierge-popup-body">
            <h4>{isLao ? 'ສົມສິ່ງພິມ Digital Concierge' : 'Som Sing Phim Digital Concierge'}</h4>
            <p>
              {isLao
                ? 'ພ້ອມໃຫ້ຄຳປຶກສາເລືອກວັດສະດຸ, ຄຳນວນລາຄາພິເສດ ແລະ ກວດສອບສະຖານະງານພິມ'
                : 'Bespoke material consultation, customized estimates, and real-time proof assistance.'}
            </p>
            <div className="concierge-channel-buttons">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="concierge-btn whatsapp"
              >
                <WhatsAppIcon />
                <span>WhatsApp VIP Concierge</span>
              </a>
              <a
                href={lineUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="concierge-btn line"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 5.82 2 10.53c0 2.96 1.8 5.57 4.54 7.02-.2.74-.72 2.7-0.83 3.12-.13.52.19.51.4.38.16-.1 2.22-1.52 3.12-2.14.9.15 1.83.23 2.77.23 5.52 0 10-3.82 10-8.53S17.52 2 12 2z" />
                </svg>
                <span>LINE Official (@somsingphim)</span>
              </a>
            </div>
          </div>
          <div className="concierge-popup-footer">
            <SparkleIcon />
            <small>{isLao ? 'ບໍລິການລະດັບ High-End Bespoke' : 'Luxury Bespoke Print Atelier'}</small>
          </div>
        </div>
      )}

      <button
        type="button"
        className="luxury-concierge-trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-label="Open VIP Concierge"
      >
        <span className="concierge-trigger-pulse" />
        <span className="concierge-trigger-icon">
          {isOpen ? (
            '✕'
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          )}
        </span>
        <span className="concierge-trigger-label">
          {isLao ? 'VIP Concierge' : 'VIP Concierge'}
        </span>
      </button>
    </aside>
  )
}
