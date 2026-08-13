import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import OrderApp from './OrderApp.tsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <OrderApp />
  </StrictMode>,
)
