import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useShop } from '../context/ShopContext.tsx'
import { WhatsAppIcon, SparkleIcon } from './icons.tsx'
import { X } from 'lucide-react'

export default function ConciergeDock() {
  const [isOpen, setIsOpen] = useState(false)
  const [shopPhone, setShopPhone] = useState('+856 20 5555 8888')
  const [whatsappNum, setWhatsappNum] = useState('8562055558888')
  const { language } = useShop()
  const location = useLocation()

  const isLao = language === 'lo'

  useEffect(() => {
    fetch('/api/v1/public/shop-info')
      .then(res => res.json())
      .then(resData => {
        if (resData && resData.data) {
          if (resData.data.phone) setShopPhone(resData.data.phone)
          if (resData.data.whatsapp_number) setWhatsappNum(resData.data.whatsapp_number)
        }
      })
      .catch(() => {})
  }, [])

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

  const cleanWhatsapp = whatsappNum.replace(/[^0-9]/g, '')
  const whatsappUrl = `https://wa.me/${cleanWhatsapp || '8562055558888'}?text=${getContextMessage()}`
  const phoneUrl = `tel:${shopPhone.replace(/\s+/g, '')}`

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
              className="concierge-close-btn flex items-center justify-center"
              onClick={() => setIsOpen(false)}
              aria-label="Close Concierge Menu"
            >
              <X size={14} />
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
                href={phoneUrl}
                className="concierge-btn phone"
                style={{ background: 'linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%)', color: '#ffffff', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', borderRadius: '12px', fontWeight: 'bold', textDecoration: 'none' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <span>{isLao ? `ໂທສາຍດ່ວນ: ${shopPhone}` : `Call: ${shopPhone}`}</span>
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
            <X size={18} />
          ) : (
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          )}
        </span>
        <span className="luxury-concierge-badge">VIP</span>
      </button>
    </aside>
  )
}
