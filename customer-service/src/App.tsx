import { useEffect } from 'react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import Header from './components/Header.tsx'
import CartDrawer from './components/CartDrawer.tsx'
import HomePage from './pages/HomePage.tsx'
import CategoryPage from './pages/CategoryPage.tsx'
import ProductPage from './pages/ProductPage.tsx'
import CheckoutPage from './pages/CheckoutPage.tsx'
import SuccessPage from './pages/SuccessPage.tsx'
import TrackingPage from './pages/TrackingPage.tsx'
import PrintGuidePage from './pages/PrintGuidePage.tsx'
import ProofReviewPage from './pages/ProofReviewPage.tsx'
import { useShop } from './context/ShopContext.tsx'
import InstallPromptBanner from './components/InstallPromptBanner.tsx'
import ConciergeDock from './components/ConciergeDock.tsx'
import BottomNavigation from './components/BottomNavigation.tsx'
import Footer from './components/Footer.tsx'

function ScrollToAnchor() {
  const location = useLocation()
  useEffect(() => {
    if (location.hash) {
      setTimeout(() => {
        const elem = document.querySelector(location.hash)
        if (elem) {
          elem.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }, [location])
  return null
}

function NotFound() {
  return (
    <section className="section text-center container min-h-60 flex flex-col items-center justify-center">
      <h2>ບໍ່ພົບໜ້າທີ່ທ່ານຄົ້ນຫາ (404 Page Not Found)</h2>
      <p className="text-muted">ໜ້ານີ້ຖືກລຶບ ຫຼື URL ບໍ່ຖືກຕ້ອງ</p>
      <Link to="/" className="btn btn--navy mt-2">
        ກັບຄືນໜ້າທຳອິດ
      </Link>
    </section>
  )
}

export default function App() {
  return (
    <>
      <ScrollToAnchor />
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/success/:orderId" element={<SuccessPage />} />
          <Route path="/track" element={<TrackingPage />} />
          <Route path="/proof/:orderId/:token" element={<ProofReviewPage />} />
          <Route path="/guide" element={<PrintGuidePage />} />
          <Route path="/materials" element={<PrintGuidePage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
      <InstallPromptBanner />
      <ConciergeDock />
      <BottomNavigation />
    </>
  )
}

