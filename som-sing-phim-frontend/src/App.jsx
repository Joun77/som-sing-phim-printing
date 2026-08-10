import { Link, Route, Routes } from 'react-router-dom'
import Header from './components/Header.jsx'
import Footer from './components/Footer.jsx'
import HomePage from './pages/HomePage.jsx'
import CategoryPage from './pages/CategoryPage.jsx'
import ProductPage from './pages/ProductPage.jsx'
import CheckoutPage from './pages/CheckoutPage.jsx'
import SuccessPage from './pages/SuccessPage.jsx'
import TrackingPage from './pages/TrackingPage.jsx'
import { useShop } from './context/ShopContext.jsx'

function NotFound() {
  return (
    <section className="section text-center container">
      <h2>ไม่พบหน้าที่คุณค้นหา (404)</h2>
      <p className="text-muted">หน้านี้ถูกลบหรือ URL ไม่ถูกต้อง</p>
      <Link to="/" className="btn btn--navy mt-2">
        กลับหน้าแรก
      </Link>
    </section>
  )
}

export default function App() {
  const { demoMode } = useShop()

  return (
    <>
      {demoMode && (
        <div className="demo-banner" role="status">
          <span>🔌</span> โหมดสาธิต (Demo Mode) — ระบบหลังบ้าน Go ไม่พร้อมใช้งาน
          ใช้ข้อมูลตัวอย่างแทน เปิด backend ที่ port 8080 เพื่อเชื่อมต่อ API จริง
        </div>
      )}
      <Header />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/category/:slug" element={<CategoryPage />} />
          <Route path="/product/:slug" element={<ProductPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/success/:orderId" element={<SuccessPage />} />
          <Route path="/track" element={<TrackingPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </>
  )
}
