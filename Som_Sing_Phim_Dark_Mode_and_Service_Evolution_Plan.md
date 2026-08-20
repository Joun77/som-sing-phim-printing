# Som Sing Phim Printing — Dark Mode Polish & Customer Service Evolution Blueprint

**Target System:** `customer-service/` (Frontend) & `admin-system/` (Backend/Integration)  
**Execution Environment:** Antigravity AI Agent IDE  
**Version:** 2.0.0 (Production-Ready Spec)  

---

## 1. Overview & Architectural Goals

เอกสารฉบับนี้รวบรวมแผนการปรับแต่งและยกระดับระบบบริการลูกค้าของ **Som Sing Phim (ສົມສິ່ງພິມ)** ครอบคลุม 2 แกนหลัก:
1. **Dark Mode UI/UX Polish ("Midnight Atelier"):** ยกระดับโทนมืดให้ได้มาตรฐานระดับพรีเมียม (WCAG AAA Contrast, Elevation Hierarchy, Luminous Gold Borders, No Muted Color Clashing)
2. **Customer Experience & Service Evolution:** วางระบบตรวจไฟล์ Preflight อัตโนมัติ, การแสดงผล 3D Proofing, ระบบสั่งพิมพ์แบบ On-Demand (ไม่มีขั้นต่ำ) สลับกับสั่งผลิตล็อตใหญ่ (มีส่วนลดตามจำนวน) และ VIP Re-order Hub

---

## 2. Complete Dark Mode Color Tokens & Elevation Spec

ปรับแต่งตัวแปร CSS ใน `customer-service/src/styles/global.css` เพื่อขจัดปัญหาตัวแปรทับซ้อนและสีกลืน:

```css
/* ========================================================
   DARK PRESS MODE ("Midnight Atelier" - ໂຮງພິມສີມືດ)
   ======================================================== */
.dark,
[data-theme="dark"] {
  /* Surface Levels (Z-Index / Elevation) */
  --bg-primary: #070D1E;            /* Level 0: Pure Deep Ink Slate */
  --bg-surface: #0E172F;            /* Level 1: Subtle Section Contrast */
  --bg-card: #142145;               /* Level 2: Solid Elevated Card */
  --bg-card-hover: #1B2C5C;         /* Level 3: Card Hover Interaction */
  --bg-input: #091226;              /* Inset: Input Fields & Dropzones */
  
  /* Text & Contrast Tokens */
  --text-main: #FFFFFF;             /* 100% Pure Crisp White */
  --text-muted: #94A3B8;            /* Slate-400 for secondary text */
  --pure-white: #FFFFFF;            /* Unbreakable Pure White for Icons/Badges */
  
  /* Metallic Champagne Accents */
  --border-gold: rgba(197, 160, 89, 0.45);
  --border-subtle: rgba(255, 255, 255, 0.08);
  --border-active: #C5A059;
  
  /* Elevation Shadows with Gold Ambient Glow */
  --card-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  --modal-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 1px 1px rgba(197, 160, 89, 0.35);

  /* Gradients */
  --grad-surface: linear-gradient(145deg, #142145 0%, #0E172F 100%);
  --grad-navy: linear-gradient(135deg, #070D1E 0%, #142145 100%);
  --grad-gold: linear-gradient(135deg, #EBD8B2 0%, #C5A059 50%, #8F6D2C 100%);
}
```

---

## 3. Step-by-Step Implementation Roadmap

```
[Phase 1: Dark Mode System Polish]
 ├── Step 1.1: Core Design Tokens & Global Styles Refactoring
 ├── Step 1.2: Spec Configurator, Stepper & Product Page UI
 └── Step 1.3: Cart Drawer, Checkout Form & Slip Upload Zone

[Phase 2: Product Mode Split & Pricing Tier UI]
 ├── Step 2.1: On-Demand vs Bulk Production Toggle Badge
 └── Step 2.2: Dynamic Quantity Stepper with Auto-Enforced MOQ

[Phase 3: Interactive Preflight & Digital Proofing]
 ├── Step 3.1: Client-side DPI / Bleed / Color Space Validator
 └── Step 3.2: 3D Box Model & Proof Watermark Viewer

[Phase 4: Customer Retention & VIP Re-order Hub]
 ├── Step 4.1: Order Tracking Timeline & Live Status Sync
 └── Step 4.2: 1-Click Reorder System from Order History
```

---

## 4. Antigravity AI Agent Actionable Prompts

คัดลอกคำสั่งด้านล่างไปวางใน **Antigravity IDE** เพื่อสั่งการให้ AI Agent รันงานตามขั้นตอนทีละ Step:

### Step 1.1: Refactor Global Dark Mode Tokens
```markdown
### Prompt for Antigravity AI Agent:
"In `customer-service/src/styles/global.css`:
1. Refactor the `.dark, [data-theme='dark']` block:
   - Ensure `--bg-primary: #070D1E`, `--bg-surface: #0E172F`, `--bg-card: #142145`, `--bg-input: #091226`.
   - Remove any destructive `--white: #111D3B` overriding; use `--text-main: #FFFFFF` and `--text-muted: #94A3B8`.
2. Add high-contrast rules for form elements in dark mode (`input`, `select`, `textarea`) with `background: var(--bg-input)` and `border: 1px solid var(--border-subtle)`.
3. Verify that all buttons retain readable contrast in dark mode."
```

### Step 1.2: Polish Product Configurator & Options Card in Dark Mode
```markdown
### Prompt for Antigravity AI Agent:
"In `customer-service/src/styles/product.css` and `customer-service/src/pages/ProductPage.tsx`:
1. Style `.option-card` in dark mode:
   - Default: `background: var(--bg-card)`, `border: 1px solid var(--border-subtle)`.
   - Active (`.is-selected`): `background: rgba(197, 160, 89, 0.12)`, `border: 1.5px solid var(--gold)`, title text in gold.
2. Style `.qty-stepper` to have crisp input visibility with dark background and gold-highlighted stepper buttons.
3. Fix the 3D canvas container background in dark mode to seamlessly blend with `--bg-surface`."
```

### Step 1.3: Polish Cart, Checkout & Payment Slip Verification in Dark Mode
```markdown
### Prompt for Antigravity AI Agent:
"In `customer-service/src/styles/cart.css` and `customer-service/src/styles/checkout.css`:
1. Refactor Cart Drawer and Order Summary Cards to use `background: var(--bg-card)` with `backdrop-filter: blur(12px)` and `border: 1px solid var(--border-gold)`.
2. Style `.dropzone-container` and slip upload box for payment verification with a distinct dashed border (`border: 2px dashed rgba(197, 160, 89, 0.4)`) and dark inset background.
3. Ensure all modal overlays have dark semi-transparent backdrops (`rgba(7, 13, 30, 0.85)`)."
```

### Step 2.1: On-Demand (No MOQ) vs Bulk Order Badge & Stepper Enforcement
```markdown
### Prompt for Antigravity AI Agent:
"In `customer-service/src/pages/ProductPage.tsx` and `customer-service/src/components/QuantityStepper`:
1. Check if `product.min_quantity === 1` or if category is on-demand:
   - Display a luxury badge: '⚡ On-Demand Printing: 1 ชิ้นก็พิมพ์ได้ (No Minimum Order)'.
   - Allow stepper to increment by 1 starting from 1.
2. If `product.min_quantity > 1` (Bulk Mode):
   - Display: '📦 สั่งผลิตจำนวนมาก (ขั้นต่ำ {min_quantity} ชิ้น)'.
   - Enforce stepper minimum value to `product.min_quantity` and show volume discount table."
```

### Step 3.1: Preflight Client-side File Checker Integration
```markdown
### Prompt for Antigravity AI Agent:
"In `customer-service/src/pages/ProductPage.tsx` and `customer-service/src/lib/preflightAnalyzer.ts`:
1. Add an artwork file upload dropzone.
2. When a customer uploads a PDF/image, analyze:
   - Image resolution (Warn if < 300 DPI)
   - Bleed margin (Check if dimensions include +3mm bleed)
   - Color mode (Warn if RGB profile is detected)
3. Display a clean visual checklist modal with green checkmarks or amber warnings before allowing checkout."
```

### Step 4.1: VIP Reorder Hub & Timeline Synchronization
```markdown
### Prompt for Antigravity AI Agent:
"In `customer-service/src/pages/TrackingPage.tsx` and `customer-service/src/api/client.ts`:
1. Ensure the order tracking timeline properly reflects real-time status from backend: `PENDING_SLIP_CHECK`, `PAYMENT_APPROVED`, `IN_PRODUCTION`, `SHIPPED`, `DELIVERED`.
2. Add a '🔁 สั่งพิมพ์ซ้ำ (Re-order)' button on completed orders that copies the exact specs and artwork link to a new cart item."
```

---

## 5. Verification & Quality Assurance Checklist

- [ ] **Contrast Check:** ทดสอบผ่าน Chrome DevTools ให้ได้คะแนน WCAG AAA สำหรับตัวหนังสือและ UI Elements
- [ ] **Theme Switching:** สลับระหว่าง Light, Dark และ System Preferences โดยไม่เกิดปัญหาสีกระพริบ (FOUC)
- [ ] **On-Demand Validation:** ทดสอบสั่งซื้อสินค้า 1 ชิ้นในโหมด On-Demand และทดสอบดักยอดขั้นต่ำในโหมด Bulk
- [ ] **Responsive Test:** ตรวจสอบการแสดงผลทั้งบน Mobile, Tablet และ Desktop ใน Dark Mode