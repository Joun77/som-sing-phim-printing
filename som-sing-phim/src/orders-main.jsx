import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n.js'
import OrderApp from './OrderApp.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <OrderApp />
  </StrictMode>,
)
