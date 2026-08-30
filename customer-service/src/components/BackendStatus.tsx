import { useShop } from '../context/ShopContext.tsx'

const LABELS = {
  checking: { dot: 'is-checking', text: 'ກຳລັງກວດສອບ...' },
  connected: { dot: 'is-on', text: 'ເຊື່ອມຕໍ່ Backend Real-time' },
  demo: { dot: 'is-demo', text: 'ໂໝດ Offline / Demo' },
  offline: { dot: 'is-off', text: 'ລະບົບຢູ່ໃນໂໝດ Offline / Demo' },
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
      aria-label="ກວດສອບການເຊື່ອມຕໍ່ລະບົບ"
    >
      <span className="backend-status-dot" aria-hidden="true" />
      <span className="backend-status-text">
        {connection.status === 'connected' ? meta.text : connection.status === 'checking' ? meta.text : meta.text}
      </span>
    </button>
  )
}
