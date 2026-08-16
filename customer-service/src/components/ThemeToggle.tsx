import React from 'react'
import { useTheme } from '../context/ThemeContext.tsx'
import { useShop } from '../context/ShopContext.tsx'

export default function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme()
  const { language } = useShop()

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="luxury-theme-toggle"
      aria-label={isDark ? (language === 'lo' ? 'ປ່ຽນເປັນໂຫມດແຈ້ງ (Ivory)' : 'Switch to Light Mode') : (language === 'lo' ? 'ປ່ຽນເປັນໂຫມດມືດ (Midnight)' : 'Switch to Dark Mode')}
      title={isDark ? (language === 'lo' ? 'ໂຫມດປັດຈຸບັນ: ມືດ (ຄລິກເພື່ອປ່ຽນເປັນແຈ້ງ)' : 'Current: Dark Mode (Click for Light)') : (language === 'lo' ? 'ໂຫມດປັດຈຸບັນ: ແຈ້ງ (ຄລິກເພື່ອປ່ຽນເປັນມືດ)' : 'Current: Light Mode (Click for Dark)')}
    >
      <div className="luxury-theme-toggle-track">
        <span className={`luxury-theme-icon moon-icon ${isDark ? 'active' : ''}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        </span>
        <span className={`luxury-theme-icon sun-icon ${!isDark ? 'active' : ''}`}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        </span>
        <div className={`luxury-theme-thumb ${isDark ? 'is-dark' : 'is-light'}`} />
      </div>
    </button>
  )
}
