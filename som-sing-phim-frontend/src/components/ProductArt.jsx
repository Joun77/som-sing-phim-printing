// ============================================================
// Product artwork — abstract brand-flavored SVG illustrations
// Used in place of photography. Navy + champagne palette.
// ============================================================

function ArtShell({ children, bg }) {
  return (
    <svg viewBox="0 0 320 240" width="100%" height="100%" aria-hidden="true">
      <defs>
        <linearGradient id="navyG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#0C2340" />
          <stop offset="100%" stopColor="#07152B" />
        </linearGradient>
        <linearGradient id="goldG" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#E2BD56" />
          <stop offset="100%" stopColor="#C59B27" />
        </linearGradient>
        <radialGradient id="glowG" cx="0.5" cy="0.3" r="0.8">
          <stop offset="0%" stopColor="#E2BD56" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#E2BD56" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="240" rx="18" fill={bg || 'url(#navyG)'} />
      <rect width="320" height="240" rx="18" fill="url(#glowG)" />
      {children}
    </svg>
  )
}

function Photo({ x, y, w, h }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="4" fill="#fff" opacity="0.94" />
      <circle cx={x + w * 0.28} cy={y + h * 0.3} r="5" fill="#E2BD56" />
      <path d={`M${x} ${y + h * 0.72} L${x + w * 0.42} ${y + h * 0.45} L${x + w * 0.68} ${y + h * 0.62} L${x + w} ${y + h * 0.3} V${y + h} H${x} Z`} fill="#C59B27" opacity="0.85" />
      <path d={`M${x + w * 0.5} ${y + h * 0.5} l10 -9`} stroke="#E2BD56" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    </g>
  )
}

export function AlbumArt() {
  return (
    <ArtShell>
      <rect x="72" y="58" width="176" height="132" rx="8" fill="#fff" opacity="0.97" />
      <rect x="66" y="52" width="188" height="140" rx="8" fill="url(#goldG)" opacity="0.55" />
      <Photo x="86" y="72" w="70" h="70" />
      <Photo x="164" y="72" w="70" h="70" />
      <Photo x="86" y="148" w="70" h="36" />
      <Photo x="164" y="148" w="70" h="36" />
      <rect x="66" y="52" width="188" height="18" rx="4" fill="url(#goldG)" />
      <rect x="70" y="58" width="60" height="6" rx="3" fill="#0C2340" opacity="0.7" />
    </ArtShell>
  )
}

export function AlbumPreviewArt() {
  return (
    <ArtShell>
      <rect x="60" y="46" width="200" height="152" rx="10" fill="#fff" opacity="0.97" />
      <rect x="52" y="38" width="216" height="164" rx="12" fill="url(#goldG)" opacity="0.5" />
      <rect x="52" y="38" width="216" height="26" rx="6" fill="url(#goldG)" />
      <rect x="58" y="46" width="90" height="8" rx="4" fill="#0C2340" opacity="0.75" />
      <Photo x="70" y="80" w="176" h="92" />
      <rect x="70" y="182" width="56" height="7" rx="3.5" fill="#0C2340" opacity="0.35" />
      <rect x="134" y="182" width="40" height="7" rx="3.5" fill="#0C2340" opacity="0.2" />
    </ArtShell>
  )
}

export function FrameArt() {
  return (
    <ArtShell>
      <rect x="86" y="42" width="148" height="156" rx="8" fill="url(#goldG)" />
      <rect x="96" y="52" width="128" height="136" rx="6" fill="#0C2340" />
      <Photo x="104" y="62" w="112" h="116" />
      <rect x="86" y="196" width="34" height="8" rx="4" fill="#E2BD56" />
      <circle cx="160" cy="42" r="5" fill="#E2BD56" opacity="0.8" />
    </ArtShell>
  )
}

export function SignArt() {
  return (
    <ArtShell>
      <path d="M60 70 L160 40 L260 70 L160 100 Z" fill="#fff" opacity="0.97" />
      <path d="M60 70 L160 40 L160 100 L60 70 Z" fill="#E2BD56" opacity="0.6" />
      <text x="160" y="82" textAnchor="middle" fontFamily="Sarabun, sans-serif" fontWeight="700" fontSize="26" fill="#0C2340">LOGO</text>
      <rect x="96" y="100" width="12" height="74" fill="#C59B27" />
      <rect x="212" y="100" width="12" height="74" fill="#C59B27" />
      <rect x="100" y="174" width="40" height="8" rx="4" fill="#E2BD56" opacity="0.7" />
    </ArtShell>
  )
}

export function StickerArt() {
  const shapes = [
    { x: 60, y: 56, r: 46 },
    { x: 170, y: 70, r: 60, star: true },
    { x: 100, y: 150, r: 42 },
    { x: 218, y: 160, r: 40 },
  ]
  return (
    <ArtShell>
      {shapes.map((s, i) =>
        s.star ? (
          <path
            key={i}
            d={`M${s.x} ${s.y - s.r} l${s.r * 0.28} ${s.r * 0.6} h${s.r * 0.62} l-${s.r * 0.5} ${s.r * 0.36} l${s.r * 0.2} ${s.r * 0.6} l-${s.r * 0.58} -${s.r * 0.34} l-${s.r * 0.58} ${s.r * 0.34} l${s.r * 0.2} -${s.r * 0.6} l-${s.r * 0.5} -${s.r * 0.36} h${s.r * 0.62} z`}
            fill={i % 2 ? '#E2BD56' : '#fff'}
            opacity="0.95"
          />
        ) : (
          <path
            key={i}
            d={`M${s.x - s.r} ${s.y} a${s.r} ${s.r} 0 1 1 ${s.r * 2} 0 a${s.r} ${s.r} 0 1 1 -${s.r * 2} 0`}
            fill={i % 2 ? '#fff' : '#E2BD56'}
            opacity="0.95"
          />
        )
      )}
      <text x="160" y="236" textAnchor="middle" fontFamily="Sarabun, sans-serif" fontSize="11" fill="#E2BD56" opacity="0.7">STICKER PACK</text>
    </ArtShell>
  )
}

export function CardArt() {
  return (
    <ArtShell>
      <rect x="66" y="44" width="188" height="150" rx="12" fill="#fff" opacity="0.97" />
      <path d="M66 44 h188 v36 a18 18 0 0 1 -18 18 h-152 a18 18 0 0 1 -18 -18 z" fill="url(#goldG)" />
      <path d="M120 60 a16 12 0 1 1 32 0 a16 12 0 1 1 -32 0" fill="#0C2340" opacity="0.85" />
      <path d="M92 108 h70 a6 6 0 0 1 6 6 v8 a6 6 0 0 1 -6 6 h-70 a6 6 0 0 1 -6 -6 v-8 a6 6 0 0 1 6 -6" fill="#0C2340" opacity="0.28" />
      <path d="M92 140 h50 a5 5 0 0 1 5 5 v6 a5 5 0 0 1 -5 5 h-50 a5 5 0 0 1 -5 -5 v-6 a5 5 0 0 1 5 -5" fill="#C59B27" opacity="0.7" />
    </ArtShell>
  )
}

export function PostcardArt() {
  return (
    <ArtShell>
      <rect x="60" y="56" width="200" height="138" rx="8" fill="#fff" opacity="0.97" />
      <rect x="60" y="56" width="200" height="60" rx="8" fill="#0C2340" opacity="0.9" />
      <circle cx="120" cy="86" r="16" fill="#E2BD56" opacity="0.8" />
      <circle cx="160" cy="86" r="10" fill="#E2BD56" opacity="0.5" />
      <path d="M76 138 l14 0" stroke="#0C2340" strokeWidth="4" strokeLinecap="round" opacity="0.3" />
      <path d="M76 150 l28 0" stroke="#0C2340" strokeWidth="4" strokeLinecap="round" opacity="0.22" />
      <rect x="224" y="120" width="22" height="16" rx="2" fill="none" stroke="#C59B27" strokeWidth="3" />
      <rect x="228" y="128" width="14" height="8" fill="none" stroke="#C59B27" strokeWidth="2.5" />
    </ArtShell>
  )
}

export function BookArt() {
  return (
    <ArtShell>
      <rect x="90" y="44" width="140" height="152" rx="8" fill="#fff" opacity="0.97" />
      <rect x="90" y="44" width="140" height="22" rx="4" fill="url(#goldG)" />
      <path d="M90 152 h140" stroke="#E2BD56" strokeWidth="2" opacity="0.5" />
      <path d="M104 92 h56 a5 5 0 0 1 5 5 v6 a5 5 0 0 1 -5 5 h-56 a5 5 0 0 1 -5 -5 v-6 a5 5 0 0 1 5 -5" fill="#0C2340" opacity="0.3" />
      <path d="M104 118 h70 a5 5 0 0 1 5 5 v6 a5 5 0 0 1 -5 5 h-70 a5 5 0 0 1 -5 -5 v-6 a5 5 0 0 1 5 -5" fill="#0C2340" opacity="0.18" />
      <path d="M104 144 h44 a5 5 0 0 1 5 5 v6 a5 5 0 0 1 -5 5 h-44 a5 5 0 0 1 -5 -5 v-6 a5 5 0 0 1 5 -5" fill="#C59B27" opacity="0.65" />
    </ArtShell>
  )
}

export const ART = {
  album: AlbumArt,
  'album-preview': AlbumPreviewArt,
  frame: FrameArt,
  sign: SignArt,
  sticker: StickerArt,
  card: CardArt,
  postcard: PostcardArt,
  book: BookArt,
}

export default function ProductArt({ art, ...props }) {
  const Cmp = ART[art] || AlbumArt
  return <Cmp {...props} />
}
