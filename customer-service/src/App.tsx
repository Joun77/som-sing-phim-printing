import { Link, Route, Routes } from 'react-router-dom'
import Header from './components/Header.tsx'
import HomePage from './pages/HomePage.tsx'
import CategoryPage from './pages/CategoryPage.tsx'
import ProductPage from './pages/ProductPage.tsx'
import CheckoutPage from './pages/CheckoutPage.tsx'
import SuccessPage from './pages/SuccessPage.tsx'
import TrackingPage from './pages/TrackingPage.tsx'
import { useShop } from './context/ShopContext.tsx'

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
  const { demoMode } = useShop()

  return (
    <>
      {demoMode && (
        <div className="demo-banner" role="status">
          ໂຫມດສາທິດ (Demo Mode) — ລະບົບຫຼັງບ້ານ Go ບໍ່ພ້ອມໃຊ້ງານ, ໃຊ້ຂໍ້ມູນຕົວຢ່າງແທນ. ເປີດ Backend ທີ່ port 8080 ເພື່ອເຊື່ອມຕໍ່ API ຕົວຈິງ.
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
    </>
  )
}
