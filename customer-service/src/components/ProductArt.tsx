// ============================================================
// Som Sing Phim - Ultra-Premium Realistic Vector Print Mockups
// Digital & Offset Print on Demand Showcase Visuals
// ============================================================

import React from 'react'

interface ArtShellProps {
  children: React.ReactNode
  bg?: string
  accent?: string
}

function ArtShell({ children, bg, accent = '#E2BD56' }: ArtShellProps) {
  return (
    <svg viewBox="0 0 360 260" width="100%" height="100%" className="w-full h-full object-cover" aria-hidden="true">
      <defs>
        <linearGradient id="artChassisG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0B1B38" />
          <stop offset="50%" stopColor="#07152B" />
          <stop offset="100%" stopColor="#030A17" />
        </linearGradient>
        <linearGradient id="goldLuxuryG" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FCE794" />
          <stop offset="50%" stopColor="#E2BD56" />
          <stop offset="100%" stopColor="#9E761E" />
        </linearGradient>
        <linearGradient id="cmykRainbowG" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00F0FF" />
          <stop offset="33%" stopColor="#FF007A" />
          <stop offset="66%" stopColor="#FFDE00" />
          <stop offset="100%" stopColor="#00E599" />
        </linearGradient>
        <radialGradient id="artGlowCenter" cx="50%" cy="40%" r="65%">
          <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
          <stop offset="100%" stopColor="#000" stopOpacity="0" />
        </radialGradient>
        <filter id="dropShadowG" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#000" floodOpacity="0.65" />
        </filter>
        <filter id="softGlowFoil" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Background Frame */}
      <rect width="360" height="260" rx="16" fill={bg || 'url(#artChassisG)'} />
      <rect width="360" height="260" rx="16" fill="url(#artGlowCenter)" />

      {/* Grid Alignment Matrix for Printing */}
      <path d="M20 30 h320 M20 230 h320 M40 20 v220 M320 20 v220" stroke="rgba(255,255,255,0.04)" strokeWidth="1" strokeDasharray="4 4" />
      
      {/* CMYK Color Proof Bar in Top Right */}
      <g transform="translate(265, 16)">
        <rect x="0" y="0" width="8" height="8" rx="2" fill="#00FFFF" />
        <rect x="12" y="0" width="8" height="8" rx="2" fill="#FF00FF" />
        <rect x="24" y="0" width="8" height="8" rx="2" fill="#FFFF00" />
        <rect x="36" y="0" width="8" height="8" rx="2" fill="#000000" stroke="rgba(255,255,255,0.3)" />
        <rect x="48" y="0" width="8" height="8" rx="2" fill="url(#goldLuxuryG)" />
      </g>

      {/* Registration Cross Marks */}
      <g stroke="rgba(255,255,255,0.25)" strokeWidth="1">
        <circle cx="25" cy="25" r="5" fill="none" />
        <line x1="16" y1="25" x2="34" y2="25" />
        <line x1="25" y1="16" x2="25" y2="34" />
      </g>

      {children}
    </svg>
  )
}

// 1. Stickers & Die-Cut Labels Art
export function StickerArt() {
  return (
    <ArtShell accent="#FF6B6B">
      <g filter="url(#dropShadowG)">
        {/* Backing Release Liner Sheet */}
        <rect x="65" y="45" width="230" height="170" rx="12" fill="#F8FAFC" stroke="rgba(226,189,86,0.5)" strokeWidth="1.5" />
        
        {/* Kiss-Cut Grid Line */}
        <rect x="75" y="55" width="210" height="150" rx="8" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
        
        {/* Main Die-Cut Holographic Sticker 1 */}
        <g transform="translate(85, 68)">
          <rect width="90" height="90" rx="45" fill="url(#cmykRainbowG)" opacity="0.9" />
          <circle cx="45" cy="45" r="38" fill="#07152B" />
          <path d="M45 22 L51 37 L67 37 L54 47 L59 63 L45 52 L31 63 L36 47 L23 37 L39 37 Z" fill="url(#goldLuxuryG)" />
          <text x="45" y="78" textAnchor="middle" fill="#E2BD56" fontSize="8" fontWeight="800" letterSpacing="1">SOM SING PHIM</text>
        </g>

        {/* Die-Cut Peeling Sticker 2 (Showing Easy-Peel Effect) */}
        <g transform="translate(190, 72)">
          <rect width="85" height="52" rx="8" fill="linear-gradient(135deg, #10B981 0%, #059669 100%)" />
          <rect x="6" y="6" width="73" height="40" rx="6" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
          <text x="42" y="25" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="900">WATERPROOF</text>
          <text x="42" y="38" textAnchor="middle" fill="rgba(255,255,255,0.9)" fontSize="8" fontWeight="700">100% PP GLOSS</text>
          
          {/* Peeling Edge Corner */}
          <path d="M65 52 L85 32 L85 52 Z" fill="#D1D5DB" />
          <path d="M65 52 L85 32 L65 32 Z" fill="#E5E7EB" filter="url(#dropShadowG)" />
        </g>

        {/* Small Round Badge 3 */}
        <g transform="translate(195, 138)">
          <circle cx="40" cy="30" r="24" fill="url(#goldLuxuryG)" />
          <circle cx="40" cy="30" r="20" fill="#0C2340" />
          <text x="40" y="33" textAnchor="middle" fill="#E2BD56" fontSize="8" fontWeight="800">KISS-CUT</text>
        </g>
      </g>
    </ArtShell>
  )
}

// 2. Luxury Business Card & Gold Foil Art
export function CardArt() {
  return (
    <ArtShell accent="#E2BD56">
      <g filter="url(#dropShadowG)">
        {/* Bottom Card in Stack */}
        <rect x="75" y="70" width="200" height="120" rx="10" fill="#1E293B" transform="rotate(-6 175 130)" opacity="0.6" />
        
        {/* Middle Card */}
        <rect x="78" y="62" width="205" height="125" rx="10" fill="#0F172A" stroke="rgba(255,255,255,0.1)" strokeWidth="1" transform="rotate(-2 180 125)" />
        
        {/* Top Hero Luxury Card */}
        <g transform="translate(80, 52)">
          {/* Dark Velvet Card Texture */}
          <rect width="210" height="130" rx="12" fill="linear-gradient(135deg, #09152B 0%, #030814 100%)" stroke="rgba(226,189,86,0.6)" strokeWidth="1.5" />
          
          {/* Hot Stamping Gold Foil Border */}
          <rect x="10" y="10" width="190" height="110" rx="8" fill="none" stroke="url(#goldLuxuryG)" strokeWidth="1.5" />
          
          {/* Embossed Gold Emblem */}
          <circle cx="45" cy="50" r="18" fill="url(#goldLuxuryG)" filter="url(#softGlowFoil)" />
          <circle cx="45" cy="50" r="15" fill="#07152B" />
          <path d="M45 39 L49 47 L58 48 L51 54 L53 62 L45 57 L37 62 L39 54 L32 48 L41 47 Z" fill="url(#goldLuxuryG)" />
          
          {/* Gold Stamped Typography */}
          <text x="75" y="46" fill="url(#goldLuxuryG)" fontSize="13" fontWeight="900" letterSpacing="1">SOM SING PHIM</text>
          <text x="75" y="58" fill="#94A3B8" fontSize="8" fontWeight="600" letterSpacing="2">PREMIUM ART CARD 350 GSM</text>
          
          <line x1="75" y1="68" x2="185" y2="68" stroke="url(#goldLuxuryG)" strokeWidth="1" opacity="0.6" />
          
          <text x="25" y="102" fill="#E2E8F0" fontSize="8" fontWeight="700">✓ Soft-Touch Matte</text>
          <text x="110" y="102" fill="#FCE794" fontSize="8" fontWeight="700">★ Hot Gold Foil</text>
        </g>
      </g>
    </ArtShell>
  )
}

// 3. Document, Spiral & Perfect Glue Binding Art
export function DocArt() {
  return (
    <ArtShell accent="#38BDF8">
      <g filter="url(#dropShadowG)">
        {/* Document Pages Layer */}
        <rect x="85" y="42" width="190" height="175" rx="6" fill="#E2E8F0" transform="rotate(4 180 130)" />
        <rect x="80" y="40" width="190" height="175" rx="6" fill="#F8FAFC" transform="rotate(2 175 127)" />
        
        {/* Main Cover Page */}
        <g transform="translate(75, 38)">
          <rect width="195" height="180" rx="8" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="1.5" />
          
          {/* Cover Header Banner */}
          <rect width="195" height="52" rx="8" fill="linear-gradient(135deg, #0284C7 0%, #0369A1 100%)" />
          <text x="32" y="28" fill="#FFFFFF" fontSize="12" fontWeight="900">ANNUAL REPORT</text>
          <text x="32" y="42" fill="#BAE6FD" fontSize="8" fontWeight="700">PRINT ON DEMAND • NO MOQ</text>

          {/* Wire-O / Spiral Binding Rings on Left */}
          <g transform="translate(10, 8)">
            {[0, 18, 36, 54, 72, 90, 108, 126, 144, 160].map((y, idx) => (
              <g key={idx} transform={`translate(0, ${y})`}>
                <rect x="0" y="0" width="12" height="6" rx="3" fill="#1E293B" />
                <path d="M-3 3 h18" stroke="url(#goldLuxuryG)" strokeWidth="2.5" strokeLinecap="round" />
              </g>
            ))}
          </g>

          {/* Document Content Simulation (Graphs & Tables) */}
          <g transform="translate(35, 68)">
            <rect x="0" y="0" width="145" height="6" rx="3" fill="#0C2340" opacity="0.75" />
            <rect x="0" y="12" width="105" height="5" rx="2.5" fill="#94A3B8" opacity="0.5" />
            
            {/* Color Chart Graphic */}
            <rect x="0" y="26" width="65" height="65" rx="6" fill="#F1F5F9" />
            <circle cx="32" cy="58" r="22" fill="none" stroke="#0284C7" strokeWidth="6" strokeDasharray="90 40" />
            <circle cx="32" cy="58" r="22" fill="none" stroke="#E2BD56" strokeWidth="6" strokeDasharray="30 100" strokeDashoffset="-90" />

            {/* Table Lines */}
            <rect x="75" y="26" width="70" height="16" rx="4" fill="#E0F2FE" />
            <rect x="75" y="48" width="70" height="12" rx="3" fill="#F8FAFC" stroke="#E2E8F0" />
            <rect x="75" y="66" width="70" height="12" rx="3" fill="#F8FAFC" stroke="#E2E8F0" />
          </g>
        </g>
      </g>
    </ArtShell>
  )
}

// 4. Photobook & Hardcover Album Art
export function AlbumArt() {
  return (
    <ArtShell accent="#EC4899">
      <g filter="url(#dropShadowG)">
        {/* Open Hardcover Layflat Photobook */}
        <g transform="translate(55, 48)">
          {/* Outer Hardcover Base */}
          <rect x="0" y="0" width="250" height="165" rx="8" fill="#0F172A" stroke="url(#goldLuxuryG)" strokeWidth="1.5" />
          
          {/* Left Page (Full Bleed Photo) */}
          <g transform="translate(8, 8)">
            <rect width="112" height="149" rx="4" fill="linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)" />
            <circle cx="56" cy="65" r="26" fill="url(#goldLuxuryG)" opacity="0.8" />
            <path d="M10 120 L45 80 L75 105 L102 70 L112 120 Z" fill="#EC4899" opacity="0.85" />
            <text x="56" y="138" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="800">LAYFLAT 180°</text>
          </g>

          {/* Center Book Gutter Crease */}
          <rect x="122" y="4" width="6" height="157" fill="linear-gradient(90deg, rgba(0,0,0,0.5), transparent, rgba(0,0,0,0.5))" />

          {/* Right Page (Gallery Typography & Image Grid) */}
          <g transform="translate(130, 8)">
            <rect width="112" height="149" rx="4" fill="#FFFFFF" />
            <rect x="8" y="10" width="96" height="58" rx="4" fill="linear-gradient(135deg, #F43F5E 0%, #FB923C 100%)" />
            <rect x="8" y="76" width="75" height="7" rx="3" fill="#0C2340" />
            <rect x="8" y="88" width="96" height="4" rx="2" fill="#94A3B8" />
            <rect x="8" y="96" width="85" height="4" rx="2" fill="#94A3B8" />
            <rect x="8" y="104" width="90" height="4" rx="2" fill="#94A3B8" />

            <g transform="translate(8, 120)">
              <rect width="44" height="20" rx="3" fill="#F1F5F9" />
              <rect x="52" width="44" height="20" rx="3" fill="#F1F5F9" />
            </g>
          </g>
        </g>
      </g>
    </ArtShell>
  )
}

// 5. Brochure & Tri-Fold Flyer Art
export function BrochureArt() {
  return (
    <ArtShell accent="#10B981">
      <g filter="url(#dropShadowG)">
        <g transform="translate(60, 45)">
          {/* Panel 1 (Back) */}
          <rect x="0" y="10" width="75" height="160" rx="6" fill="#0F172A" stroke="#E2BD56" strokeWidth="1" transform="skewY(-6)" />
          {/* Panel 2 (Middle) */}
          <rect x="80" y="5" width="75" height="160" rx="6" fill="#1E293B" stroke="#E2BD56" strokeWidth="1" />
          {/* Panel 3 (Front Cover) */}
          <g transform="translate(160, 0)">
            <rect width="80" height="165" rx="6" fill="linear-gradient(135deg, #10B981 0%, #047857 100%)" stroke="#FFFFFF" strokeWidth="1" />
            <circle cx="40" cy="45" r="22" fill="url(#goldLuxuryG)" />
            <text x="40" y="90" textAnchor="middle" fill="#FFFFFF" fontSize="10" fontWeight="900">TRI-FOLD</text>
            <text x="40" y="104" textAnchor="middle" fill="#A7F3D0" fontSize="7" fontWeight="700">FLYER / PROMO</text>
            <rect x="12" y="120" width="56" height="6" rx="3" fill="#FFFFFF" opacity="0.9" />
            <rect x="16" y="132" width="48" height="5" rx="2.5" fill="#A7F3D0" opacity="0.8" />
          </g>
        </g>
      </g>
    </ArtShell>
  )
}

export const ART: Record<string, React.FC> = {
  doc: DocArt,
  documents: DocArt,
  sticker: StickerArt,
  stickers: StickerArt,
  card: CardArt,
  photos: AlbumArt,
  album: AlbumArt,
  brochure: BrochureArt,
  book: DocArt,
}

export type ProductArtProps = { art: string; className?: string } & React.HTMLAttributes<HTMLDivElement>

export default function ProductArt({ art, className = '', ...props }: ProductArtProps) {
  if (!art) return <DocArt />
  const isUrl = art.startsWith('http') || art.startsWith('/api') || art.startsWith('/uploads') || art.startsWith('/images') || art.includes('/')
  if (isUrl) {
    return (
      <div className={`w-full h-full relative overflow-hidden flex items-center justify-center bg-slate-900 ${className}`} {...props}>
        <img
          src={art}
          alt="Product preview"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          onError={(e) => {
            // fallback if image not found
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
    )
  }
  const normalizedKey = art.toLowerCase().trim()
  const Cmp = ART[normalizedKey] || DocArt
  return <Cmp />
}
