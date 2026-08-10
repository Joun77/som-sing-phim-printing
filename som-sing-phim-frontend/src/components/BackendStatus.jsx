import { useShop } from '../context/ShopContext.jsx'

const LABELS = {
  checking: { dot: 'is-checking', text: 'กำลังตรวจสอบ…' },
  connected: { dot: 'is-on', text: 'เชื่อมต่อ backend แล้ว' },
  demo: { dot: 'is-demo', text: 'Demo Mode' },
  offline: { dot: 'is-off', text: 'ไม่พบ backend' },
}

export default function BackendStatus() {
  const { connection, testConnection } = useShop()
  const meta = LABELS[connection.status] || LABELS.checking
  const busy = connection.status === 'checking'

  return (
    <button
      type="button"
      className={`backend-status ${meta.dot}`}
      onClick={testConnection}
      disabled={busy}
      title={connection.message}
      aria-label="ทดสอบการเชื่อมต่อระบบหลังบ้าน"
    >
      <span className="backend-status-dot" aria-hidden="true" />
      <span className="backend-status-text">
        {connection.status === 'connected' ? meta.text : connection.status === 'checking' ? meta.text : 'เชื่อมต่อ'}
      </span>
    </button>
  )
}
