# 💎 Som Sing Phim - Luxury Customer Service Web App (UI/UX & Full PWA Architecture) - V2

> **Document Type:** System Architecture, Dual Theme (Dark Luxury & Light Royalty), Progressive Web App (PWA) & IDE Blueprint  
> **Target Project:** `som-sing-phim-frontend` (Customer Service Web Application)  
> **Brand Identity:** High-End Bespoke Printing Atelier & Digital Concierge (ສົມສິ່ງພິມ)  
> **Version:** 2.0 (Dual Theme + PWA Web App Enabled)  
> **Generated Date:** 2026-08-17  

---

## 1. 🎨 Dual Luxury Design System: Dark Mode & Light Mode (Tokens & Gradients)

การวาง Palette สีระดับ Luxury ตามที่กำหนด โดยแบ่งเป็น **Midnight Royal (โหมดมืด)** และ **Ivory Palais (โหมดสว่าง/โหมดแจ้ง)** พร้อมระบบ Gradient และ Glassmorphism สำหรับทั้งสองโหมด

```css
:root {
  /* ========================================================
     1. LIGHT LUXURY MODE ("Ivory Palais" - โหมดสว่าง / โหมดแจ้ง)
     ======================================================== */
  --bg-primary-light: #FDFCFA;           /* Pure Warm Ivory */
  --bg-surface-light: #F5F0EB;           /* Swan Wing Silk Background */
  --bg-card-light: rgba(255, 255, 255, 0.85); /* Frost Ivory Glass */
  --text-main-light: #112250;            /* Deep Royal Blue Headings */
  --text-muted-light: #3C5070;           /* Sapphire Secondary Text */
  --border-gold-light: rgba(224, 198, 143, 0.55); /* Elegant Champagne Gold Border */
  --card-shadow-light: 0 10px 30px -10px rgba(17, 34, 80, 0.08), 0 0 1px 1px rgba(224, 198, 143, 0.3);

  /* Light Gradients */
  --grad-surface-light: linear-gradient(135deg, #FFFFFF 0%, #F5F0EB 50%, #EFE8DF 100%);
  --grad-hero-light: radial-gradient(circle at 10% 10%, rgba(224, 198, 143, 0.25) 0%, transparent 40%),
                     radial-gradient(circle at 90% 90%, rgba(60, 80, 112, 0.08) 0%, transparent 50%),
                     #FDFCFA;
  --grad-accent-btn-light: linear-gradient(135deg, #112250 0%, #1c336b 60%, #3C5070 100%);
  --grad-gold-shimmer-light: linear-gradient(135deg, #B39355 0%, #E0C68F 50%, #9A7B3E 100%);
}

.dark {
  /* ========================================================
     2. DARK LUXURY MODE ("Midnight Sapphire" - โหมดมืด)
     ======================================================== */
  --bg-primary-dark: #070D1E;            /* Ultra-Deep Midnight Slate */
  --bg-surface-dark: #0B1533;            /* Deep Royal Obsidian */
  --bg-card-dark: rgba(17, 34, 80, 0.55);/* Sapphire Dark Glass Card */
  --text-main-dark: #F5F0EB;             /* Swan Wing Crisp Text */
  --text-muted-dark: #D8CBC2;            /* Shellstone Warm Grey Subtitle */
  --border-gold-dark: rgba(224, 198, 143, 0.25); /* Subtle Gold Hairline */
  --card-shadow-dark: 0 20px 40px -15px rgba(0, 0, 0, 0.7), 0 0 1px 1px rgba(224, 198, 143, 0.2);

  /* Dark Gradients */
  --grad-surface-dark: linear-gradient(145deg, rgba(60, 80, 112, 0.2) 0%, rgba(11, 21, 51, 0.8) 100%);
  --grad-hero-dark: radial-gradient(circle at 15% 20%, rgba(60, 80, 112, 0.35) 0%, transparent 50%),
                   radial-gradient(circle at 85% 80%, rgba(224, 198, 143, 0.12) 0%, transparent 45%),
                   #070D1E;
  --grad-accent-btn-dark: linear-gradient(135deg, #E0C68F 0%, #F5F0EB 40%, #B39355 100%);
  --grad-gold-shimmer-dark: linear-gradient(135deg, #E0C68F 0%, #F5F0EB 50%, #B39355 100%);
}
```

---

## 2. 📱 การยกระดับเป็น Progressive Web App (PWA) และ Web App Experience

เพื่อให้ลูกค้าใช้งานเสมือน **Native Mobile Concierge App** โดยไม่ต้องติดตั้งผ่าน App Store:

1. **Installable Web App (PWA Manifest & Service Worker):**
   - ลูกค้าสามารถกดปุ่ม *"เพิ่มลงในหน้าจอโฮม (Add to Home Screen)"* เพื่อเปิดใช้งานแบบ Standalone Fullscreen (ไม่มี URL bar).
   - ปรับแต่ง App Icon สีทอง-น้ำเงินหรูหรา และ Splash Screen สำหรับ iPhone และ Android.
2. **Push Notifications & Live Status Alerts (Web Push):**
   - แจ้งเตือนลูกค้าอัตโนมัติเมื่อสถานะงานเปลี่ยน เช่น *"Artwork ของคุณได้รับการอนุมัติแล้ว และกำลังเข้าสู่แท่นพิมพ์"*.
3. **Offline & Cache First for Portfolios:**
   - แคชคอลเลกชันตัวอย่างงานพิมพ์ กระดาษพรีเมียม และเรทราคา เพื่อให้เปิดดูแคตตาล็อกได้ทันทีแม้เน็ตช้า.
4. **Haptic & Gesture Interactions:**
   - เพิ่ม Micro-animations, Bottom Sheet Drawer บนมือถือ และปุ่มสลับธีม (Theme Toggle) แบบ Smooth Luxury Transition.

---

## 3. 🔍 การตรวจสอบข้อบกพร่องและฟังก์ชันเพิ่มเติม (Gap Analysis & Enhancements)

| ฟังก์ชัน / องค์ประกอบ | ปัญหาและข้อจำกัดเดิม | การปรับปรุงสู่ Luxury Web App (V2) |
| :--- | :--- | :--- |
| **1. Theme Switcher** | มีธีมเดียว ขาดความยืดหยุ่นตามสภาพแสง | เพิ่ม **Bespoke Theme Switcher** สลับ Dark/Light mode แบบ Smooth fade พร้อมจำค่าผ่าน `localStorage` |
| **2. Mobile & PWA App** | เป็นเว็บเพจทั่วไป ไม่มี App Manifest | ติดตั้ง **PWA Plugin + Service Worker** รองรับ Offline Catalog, Standalone Window, Push Notifications |
| **3. Interactive Proofing** | ลูกค้าตรวจไฟล์งานยากบนมือถือ | ทำ **Mobile-Optimized Proof Viewer** รองรับ Pinch-to-Zoom, ไฮไลต์จุดแก้ไข และปุ่ม Digital Sign-off |
| **4. Live Milestone Tracker** | ดูสเตตัสแบบ Text ธรรมดา | ทำ **Live Animated Stepper Bar** สีทอง Shimmer แสดงแบบ Real-time พร้อมเวลาโดยประมาณ (ETA) |
| **5. VIP Direct Concierge** | ปุ่มแชทแยก ข้อมูลไม่เชื่อมโยง | Floating Concierge Dock เชื่อมโยง Order ID อัตโนมัติเวลาทักแชท LINE/WhatsApp ทำให้ทีมงานให้บริการได้ทันที |

---

## 4. 🏛️ สถาปัตยกรรมระบบบริการลูกค้า (Web App Architecture)

```
[ som-sing-phim-frontend (React 18 + Vite + TypeScript + Tailwind CSS) ]
   ├── 📱 PWA Engine (Workbox, Web App Manifest, Service Worker, Push API)
   ├── 🌗 Theme Engine (ThemeContext, Tailwind Dark Mode Selector, CSS Variables)
   ├── 💎 Luxury UI Layer
   │    ├── Hero & Showcase (Interactive Reels, Foil Texture Preview)
   │    ├── Bespoke Estimator Wizard (Dynamic Material & Finishing Selection)
   │    ├── VIP Client Portal (Active Orders, Proofing Approval, Digital Invoices)
   │    ├── Live Milestone Tracking (Real-time WebSockets / Polling)
   │    └── Concierge Floating Dock (WhatsApp / LINE with Auto Order Context)
   └── 🌐 API Integration (Go Backend Public API: /api/v1/public/*)
```

---

## 5. 📋 แผนการพัฒนาและคำสั่งสำหรับ IDE (Step-by-Step Implementation Prompt)

```markdown
# TASK: Implement Dual-Theme (Dark/Light) & PWA Web App for 'som-sing-phim-frontend'

### Objective:
Upgrade the customer-facing frontend into an installable, high-performance Luxury Web App (PWA) with full Dark/Light mode support, utilizing the royal palette (#112250, #3C5070, #E0C68F, #F5F0EB, #D8CBC2).

---

### Step 1: Tailwind CSS & Dual-Theme Setup
1. Update `tailwind.config.js` to enable class-based dark mode:
   ```javascript
   module.exports = {
     darkMode: 'class',
     theme: {
       extend: {
         colors: {
           royal: { DEFAULT: '#112250', dark: '#070D1E', light: '#1c336b' },
           sapphire: { DEFAULT: '#3C5070', light: '#536D96' },
           gold: { DEFAULT: '#E0C68F', light: '#F3E5C8', dark: '#B39355' },
           swan: '#F5F0EB',
           shell: '#D8CBC2',
           darkbg: '#070D1E',
           lightbg: '#FDFCFA'
         },
         fontFamily: {
           serif: ['Cormorant Garamond', 'Playfair Display', 'serif'],
           sans: ['Plus Jakarta Sans', 'Noto Sans Lao', 'sans-serif'],
         }
       }
     }
   }
   ```
2. Create `src/context/ThemeContext.tsx`:
   - Support `theme: 'light' | 'dark' | 'system'`.
   - Auto-sync with HTML class tag and store state in `localStorage`.
   - Create `src/components/common/ThemeToggle.tsx` with a luxurious sun/moon morphing icon and gold shimmer border.

---

### Step 2: Progressive Web App (PWA) Configuration
1. Install `vite-plugin-pwa`:
   ```bash
   npm install vite-plugin-pwa -D
   ```
2. Configure `vite.config.ts`:
   ```typescript
   import { VitePWA } from 'vite-plugin-pwa';

   export default defineConfig({
     plugins: [
       react(),
       VitePWA({
         registerType: 'autoUpdate',
         includeAssets: ['favicon.svg', 'logo.png', 'icons/*.png'],
         manifest: {
           name: 'ສົມສິ່ງພິມ | Som Sing Phim Bespoke Concierge',
           short_name: 'SomSingPhim',
           description: 'Luxury Bespoke Printing & Digital Concierge Platform',
           theme_color: '#112250',
           background_color: '#070D1E',
           display: 'standalone',
           orientation: 'portrait',
           icons: [
             { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
             { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' }
           ]
         }
       })
     ]
   });
   ```
3. Create `src/components/common/InstallPromptBanner.tsx`:
   - A non-intrusive luxury gold banner prompting customers: *"เพิ่ม Som Sing Phim ไปยังหน้าจอหลักเพื่อติดตามสถานะงานพิมพ์ได้รวดเร็ว (Install Web App)"*.

---

### Step 3: Dual-Mode Luxury Components
1. **Hero & Landing (`src/components/landing/HeroSection.tsx`):**
   - **Dark Mode:** Deep Midnight background (`#070D1E`) with gold glowing mesh & sparkling foil highlights.
   - **Light Mode:** Crisp Warm Ivory (`#FDFCFA`) with Royal Blue typography and Champagne Gold accents.
2. **Materials Showcase (`src/components/landing/MaterialExplorer.tsx`):**
   - Interactive 3D paper swatch viewer with texture toggles (Emboss, Gold Foil, Spot UV).
3. **Milestone Tracker (`src/components/portal/MilestoneTracker.tsx`):**
   - Adapts cleanly to both themes with animated progress lines in Shimmer Gold.
4. **Artwork Proofing & Approval (`src/components/portal/ProofViewer.tsx`):**
   - Fullscreen PDF/Image proof inspection with digital signature canvas for client sign-off.

---

### Step 4: Verification & Testing Checklist
- [ ] Theme toggling works instantaneously without page flash (No FOUC).
- [ ] Contrast ratio meets WCAG AA standards in both Light and Dark modes.
- [ ] PWA installs successfully on iOS (Safari Add to Home) and Android (Chrome Install).
- [ ] Responsive UI functions smoothly down to 360px mobile viewports.
```

---

## 6. 💡 สรุปการเชื่อมต่อระบบ (Integration Protocol)
* **API Endpoints:** ใช้ Public Customer Endpoints (`/api/v1/orders/track/:trackingCode`, `/api/v1/quotes/estimate`, `/api/v1/proofs/approve`) จาก Go Backend.
* **Separation of Concerns:** ระบบนี้คือส่วนงานบริการลูกค้าภายนอก (`som-sing-phim-frontend`) ซึ่งแยกโฟลเดอร์และการควบคุมสิทธิ์ออกจากระบบแอดมิน (`somsingphim`).
