import { Link, useLocation, useParams } from 'react-router-dom'
import { useShop } from '../context/ShopContext.tsx'
import { formatMoney } from '../utils/currency.ts'
import { PrinterIcon } from '../components/icons.tsx'
import ProductArt from '../components/ProductArt.tsx'
import { getProduct } from '../data/catalog.ts'
import type { Order } from '../api/client.ts'

function useOrder(): Order | null {
  const { orderId } = useParams()
  const location = useLocation()
  const { placedOrder } = useShop()
  if (location.state && location.state.order) return location.state.order as Order
  if (placedOrder && placedOrder.order_id === orderId) return placedOrder
  return null
}

export default function SuccessPage() {
  const order = useOrder()
  const { currency, convertTo } = useShop()

  if (!order) {
    return (
      <section className="section text-center container">
        <h2>ไม่พบข้อมูลคำสั่งซื้อ</h2>
        <p className="text-muted">กรุณาตรวจสอบ Order ID หรือกลับไปติดตามสถานะงานพิมพ์</p>
        <Link to="/track" className="btn btn--navy mt-2">
          ไปหน้าติดตามสถานะ
        </Link>
      </section>
    )
  }

  const product = getProduct(order.product_id)
  const subtotal = order.total_price - (order.shipping_fee || 0)
  const shippingFee = order.shipping_fee || 0
  const courierName = order.shipping_courier || '—'
  const orderDate = new Date(order.created_at || Date.now())

  return (
    <section className="section section--alt success-page">
      <div className="container success-container">
        {/* ---------- Print-friendly receipt ---------- */}
        <div className="receipt" id="receipt">
          <div className="receipt-header">
            <div className="receipt-logo">
              <span className="header-logo-mark" aria-hidden="true">
                <svg viewBox="0 0 40 40" width="42" height="42">
                  <rect width="40" height="40" rx="10" fill="#0C2340" />
                  <path d="M20 6 24 16 34 20 24 24 20 34 16 24 6 20 16 16 Z" fill="#E2BD56" />
                </svg>
              </span>
              <div>
                <strong>ส้มสิ่งพิมพ์ SOM SING PHIM</strong>
                <small>ใบสรุปคำสั่งซื้อ / Order Receipt</small>
              </div>
            </div>
            <div className="receipt-order-id">
              <span>Order ID</span>
              <strong>{order.order_id}</strong>
              <small>วันที่: {orderDate.toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })}</small>
            </div>
          </div>

          <div className="receipt-status">
            <span className="badge badge--navy">ได้รับออเดอร์แล้ว — รอแอดมินตรวจสอบสลิป</span>
          </div>

          <div className="receipt-grid">
            <div className="receipt-block">
              <h4>ข้อมูลผู้รับ</h4>
              <p>
                <strong>{order.customer_name}</strong>
                <br />
                โทร: {order.phone}
                <br />
                ที่อยู่: {order.address}
              </p>
            </div>
            <div className="receipt-block">
              <h4>ข้อมูลสินค้า</h4>
              <p>
                <strong>{product ? product.name : order.product_id}</strong>
                <br />
                ขนาด: {order.specs?.size}
                <br />
                วัสดุ: {order.specs?.paper}
                <br />
                เทคนิค: {order.specs?.finishing}
                <br />
                จำนวน: {order.quantity} ชิ้น
              </p>
            </div>
          </div>

          {product && (
            <div className="receipt-art">
              <ProductArt art={product.image} />
            </div>
          )}

          <table className="receipt-table">
            <thead>
              <tr>
                <th>รายการ</th>
                <th className="ta-r">จำนวน</th>
                <th className="ta-r">ราคาต่อชิ้น</th>
                <th className="ta-r">รวม</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  {product ? product.name : order.product_id}
                  {order.special_notes && <small className="receipt-note">หมายเหตุ: {order.special_notes}</small>}
                </td>
                <td className="ta-r">{order.quantity}</td>
                <td className="ta-r">{formatMoney(convertTo(subtotal / order.quantity), currency)}</td>
                <td className="ta-r">{formatMoney(convertTo(subtotal), currency)}</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} className="ta-r">
                  ค่าจัดส่ง ({courierName})
                </td>
                <td className="ta-r">{shippingFee > 0 ? formatMoney(convertTo(shippingFee), currency) : 'ส่งฟรี'}</td>
              </tr>
              <tr className="receipt-total-row">
                <td colSpan={3} className="ta-r">
                  ยอดรวมทั้งสิ้น
                </td>
                <td className="ta-r">{formatMoney(convertTo(order.total_price), currency)}</td>
              </tr>
            </tfoot>
          </table>

          <div className="receipt-footer">
            <p>ช่องทางการติดต่อ: โทร 081-234-5678 · LINE @som-sing-phim · som.sing.phim@gmail.com</p>
            <p className="receipt-footer-note">
              ติดตามสถานะงานพิมพ์ได้ที่เว็บไซต์ด้วย Order ID: {order.order_id} — ขอบคุณที่ใช้บริการส้มสิ่งพิมพ์
            </p>
          </div>
        </div>

        {/* ---------- Action buttons ---------- */}
        <div className="success-actions">
          <h2 className="text-center">สั่งพิมพ์สำเร็จ!</h2>
          <p className="text-center text-muted">
            ระบบได้รับคำสั่งซื้อของคุณแล้ว เจ้าหน้าที่จะตรวจสอบสลิปและเริ่มงานพิมพ์โดยเร็วที่สุด
            <br />
            จด Order ID <strong className="text-gold">{order.order_id}</strong> ไว้เพื่อติดตามสถานะได้
          </p>
          <div className="success-btns">
            <button type="button" className="btn btn--gold btn--lg" onClick={() => window.print()}>
              <PrinterIcon size={20} /> พิมพ์ / เซฟใบสรุป (PDF)
            </button>
            <Link to="/track" className="btn btn--navy btn--lg">
              ติดตามสถานะงานพิมพ์
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
