# ส้มสิ่งพิมพ์ SOM SING PHIM — Frontend

Frontend ของระบบเว็บไซต์บริการงานพิมพ์คุณภาพสูง (E-Commerce Catalog & Order Tracking System)
เชื่อมต่อกับ Go Backend ผ่าน REST API เท่านั้น (Decoupled Front-End) ไม่มีการสมัครสมาชิก / Login

## Tech Stack

- React 18 + Vite 5
- React Router 6
- CSS Design System (Navy Blue #0C2340 / Gold #C59B27, Sarabun & Noto Sans Thai)
- `qrcode.react` สำหรับสร้าง PromptPay QR (EMVCo/Thai QR มาตรฐาน)

## โครงสร้างโฟลเดอร์

```
som-sing-phim-frontend/
├── index.html
├── vite.config.js          # dev proxy /api -> localhost:8080
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx / App.jsx  # routing
    ├── api/client.js       # REST client + mock fallback (Demo Mode)
    ├── context/ShopContext.jsx  # currency + rates + order draft
    ├── data/catalog.js     # สินค้า หมวดหมู่ สเปก
    ├── data/shipping.js    # บริษัทขนส่ง / เงื่อนไขส่งฟรี / บัญชี
    ├── utils/pricing.js    # real-time pricing engine
    ├── utils/currency.js   # THB/LAK
    ├── utils/promptpay.js  # PromptPay payload generator
    ├── components/         # Header, Footer, Hero, BestSellers, Categories, HowItWorks, icons, ProductArt
    └── pages/              # Home, Category, Product(configurator), Checkout, Success, Tracking
```

## หน้าเว็บ

| Route | หน้า | คุณสมบัติ |
| --- | --- | --- |
| `/` | Homepage | Hero, สินค้าขายดี, หมวดหมู่, How It Works (4 ขั้นตอน) |
| `/category/:slug` | หมวดหมู่สินค้า | 5 หมวดหมู่ตามสเปก |
| `/product/:slug` | Configurator | Button Cards Grid เลือกสเปก, ลิงก์ Google Drive, checkbox ยืนยันสิทธิ์, หมายเหตุช่างพิมพ์, ราคาเรียลไทม์, Mobile Sticky Bar |
| `/checkout` | ชำระเงิน | ข้อมูลผู้รับ, บริษัทขนส่ง + ส่งฟรี, PromptPay QR + บัญชี + ปุ่มคัดลอก, อัปโหลดสลิป + Preview |
| `/success/:orderId` | ใบสรุปคำสั่งซื้อ | แสดง Order ID (SSP-xxxxx), ปุ่มพิมพ์/เซฟ PDF |
| `/track` | ติดตามสถานะ | ค้นหาด้วย Order ID, Timeline สถานะ, ปุ่ม WhatsApp เคสด่วน |

## API Integration (Go Backend)

Frontend คุยกับ backend ผ่าน REST โดยตรง (CORS-enabled) ตั้ง URL ได้ผ่าน `VITE_API_BASE_URL`:

| Method | Endpoint | ใช้สำหรับ |
| --- | --- | --- |
| GET | `/api/rates` | ดึงอัตราแลกเปลี่ยนสำหรับสลับสกุลเงิน THB/LAK |
| POST | `/api/pricing/calculate` | คำนวณราคา (fallback: pricing engine ฝั่ง frontend) |
| GET | `/api/orders` | รายการออเดอร์สำหรับหน้า tracking |
| POST | `/api/orders` | ส่งคำสั่งซื้อ + สลิป |

> ถ้า backend ยังไม่เปิดใช้งาน Frontend จะทำงานใน **Demo Mode** โดยใช้ข้อมูลตัวอย่าง
> และแสดงแถบเตือน "โหมดสาธิต" ด้านบน

## วิธีรัน

### รันพร้อมกัน (Backend + Frontend) — วิธีแนะนำสำหรับทดลอง

ที่ root ของโปรเจกต์ (`som-sing-phim-printing/`):

```bash
./run-dev.sh        # สตาร์ท backend :8080 + frontend :5173 พร้อมกัน
```

หรือรันจากโฟลเดอร์ frontend:

```bash
cd som-sing-phim-frontend
npm run dev:all     # รันทั้ง backend + frontend ด้วยกัน
```

แล้วเปิด http://localhost:5173

### รันแยก

```bash
# Frontend
npm install
npm run dev          # http://localhost:5173

# Backend (อีกเทอร์มินัล)
cd ../backend
go run .             # REST API ที่ port 8080
go test ./...        # รันเทสต์ backend
```

### ปุ่มเชื่อมต่อ backend (บนหน้าเว็บ)

ที่แถบบนสุดของเว็บ (ติดกับปุ่มสลับสกุลเงิน) จะมีปุ่ม **เชื่อมต่อ** สำหรับทดสอบการเชื่อมต่อกับ Go backend:
- 🟢 สีเขียว = เชื่อมต่อ backend สำเร็จ (ใช้ข้อมูลจริงจาก API)
- 🟠 สีทอง/เหลือง = ยังใช้ Demo Mode (ข้อมูลตัวอย่าง) — กดปุ่มเพื่อลองเชื่อมต่อใหม่
- 🔴 สีแดง = ไม่พบ backend

## Backend (อยู่ในโฟลเดอร์ `backend/` ของโปรเจกต์หลัก)
