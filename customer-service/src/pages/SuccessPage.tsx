import { Link, useLocation, useParams } from 'react-router-dom'
import { useShop } from '../context/ShopContext.tsx'
import { formatMoney } from '../utils/currency.ts'
import { PrinterIcon, CheckIcon, TruckIcon } from '../components/icons.tsx'
import ProductArt from '../components/ProductArt.tsx'
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
  const { currency, convertTo, t, language, getProduct } = useShop()

  if (!order) {
    return (
      <section className="section text-center container min-h-60 flex flex-col items-center justify-center">
        <h2>{language === 'en' ? 'Order Not Found' : 'ບໍ່ພົບຂໍ້ມູນຄຳສັ່ງຊື້'}</h2>
        <p className="text-muted">{language === 'en' ? 'Please check your Order ID or track order status.' : 'ກະລຸນາກວດສອບ Order ID ຫຼື ກັບໄປຕິດຕາມສະຖານະງານພິມ'}</p>
        <Link to="/track" className="btn btn--navy mt-2">
          {t('navTrack')}
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
        {/* Print-friendly receipt */}
        <div className="receipt" id="receipt">
          <div className="receipt-header">
            <div className="receipt-logo">
              <span className="header-logo-circle" aria-hidden="true">
                <img src="/logo.png" alt="Som Sing Phim Logo" className="header-logo-img" />
              </span>
              <div>
                <strong>{t('appName')} {t('appSub')}</strong>
                <small>{language === 'en' ? 'Order Summary & Receipt' : 'ໃບສະຫຼຸບຄຳສັ່ງຊື້ / Order Receipt'}</small>
              </div>
            </div>
            <div className="receipt-order-id">
              <span>{t('orderIdLabel')}</span>
              <strong className="font-mono text-primary-navy">{order.order_id}</strong>
              <small>{language === 'en' ? 'Date:' : 'ວັນທີ:'} {orderDate.toLocaleString(language === 'en' ? 'en-US' : 'lo-LA', { dateStyle: 'medium', timeStyle: 'short' })}</small>
            </div>
          </div>

          <div className="receipt-status">
            <span className="badge badge--navy flex items-center gap-1.5">
              <CheckIcon size={14} />
              <span>{language === 'en' ? 'Order Received — Waiting for Slip Verification' : 'ໄດ້ຮັບອໍເດີແລ້ວ — ລໍຖ້າກວດສອບສະລິບ'}</span>
            </span>
          </div>

          <div className="receipt-grid">
            <div className="receipt-block">
              <h4>{t('customerInfoTitle')}</h4>
              <p>
                <strong>{order.customer_name}</strong>
                <br />
                {language === 'en' ? 'Tel:' : 'ໂທ:'} {order.phone}
                <br />
                {language === 'en' ? 'Address:' : 'ທີ່ຢູ່:'} {order.address}
              </p>
            </div>
            <div className="receipt-block">
              <h4>{t('selectedSpecSummary')}</h4>
              <p>
                <strong>{product ? (language === 'en' && product.nameEn ? product.nameEn : product.name) : order.product_id}</strong>
                <br />
                {language === 'en' ? 'Size:' : 'ຂະໜາດ:'} {order.specs?.size}
                <br />
                {language === 'en' ? 'Material:' : 'ວັດສະດຸ:'} {order.specs?.paper}
                <br />
                {language === 'en' ? 'Finishing:' : 'ເຕັກນິກ:'} {order.specs?.finishing}
                <br />
                {language === 'en' ? 'Quantity:' : 'ຈຳນວນ:'} {order.quantity} {language === 'en' ? 'Units' : 'ຊິ້ນ'}
              </p>
            </div>
          </div>

          {product && (
            <div className="receipt-art">
              <ProductArt art={product.image} />
            </div>
          )}

          <div className="receipt-lines">
            <div className="receipt-line">
              <span>{language === 'en' ? 'Subtotal' : 'ຍອດລວມສິນຄ້າ'}</span>
              <strong>{formatMoney(convertTo(subtotal), currency)}</strong>
            </div>
            <div className="receipt-line">
              <span>{language === 'en' ? 'Shipping Fee' : 'ຄ່າຈັດສົ່ງ'} ({courierName})</span>
              <strong>
                {shippingFee === 0 ? (
                  <span className="text-success">{language === 'en' ? 'Free Shipping' : 'ສົ່ງຟຣີ'}</span>
                ) : (
                  formatMoney(convertTo(shippingFee), currency)
                )}
              </strong>
            </div>
            <div className="receipt-line receipt-line--total">
              <span>{language === 'en' ? 'Total Paid' : 'ຍອດລວມທັງໝົດ'}</span>
              <strong>{formatMoney(convertTo(order.total_price), currency)}</strong>
            </div>
          </div>

          <div className="receipt-foot">
            <p>{t('keepOrderIdNotice')}</p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="success-actions">
          <button type="button" className="btn btn--white" onClick={() => window.print()}>
            <PrinterIcon size={18} /> {t('printSavePdf')}
          </button>
          <Link to={`/track?q=${order.order_id}`} className="btn btn--gold shadow-glow">
            <TruckIcon size={18} /> {t('trackNowBtn')}
          </Link>
        </div>
      </div>
    </section>
  )
}
