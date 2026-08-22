import React, { createContext, useContext, useEffect } from 'react'

export type ThemeMode = 'light'

interface ThemeContextType {
  theme: ThemeMode
  resolvedTheme: 'light'
  setTheme: (theme: ThemeMode) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'ssp_theme_mode'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('dark')
    root.setAttribute('data-theme', 'light')
    localStorage.setItem(STORAGE_KEY, 'light')
  }, [])

  const setTheme = () => {}
  const toggleTheme = () => {}

  return (
    <ThemeContext.Provider value={{ theme: 'light', resolvedTheme: 'light', setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

