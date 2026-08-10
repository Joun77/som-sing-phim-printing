ข้อกำหนดระบบหน้าบ้านและสถาปัตยกรรม UI/UX ส้มสิ่งพิมพ์ (SOM SING PHIM)
ระบบเว็บไซต์บริการงานพิมพ์คุณภาพสูง (E-Commerce Catalog & Tracking System)
1. ภาพรวมโปรเจกต์และเป้าหมาย (Project Overview & Vision)
เว็บไซต์บริการงานพิมพ์สำหรับแบรนด์ "ส้มสิ่งพิมพ์" (SOM SING PHIM) ออกแบบในรูปแบบ Catalog & Order Tracking System เน้นการใช้งานที่ง่าย รวดเร็ว สวยงาม และน่าเชื่อถือ โดยไม่ต้องให้ลูกค้าสมัครสมาชิกหรือเข้าสู่ระบบ (No User Authentication)
ข้อกำหนดการจัดตั้งโปรเจกต์ (Project Setup Instruction):
ให้สร้างเป็น โปรเจกต์ใหม่ในโฟลเดอร์ใหม่ทั้งหมด (Clean Standalone Project / New Folder) เช่น som-sing-phim-frontend โดยไม่ปะปนหรือผูกกับโครงสร้างไฟล์เก่า
สถาปัตยกรรมเน้น Decoupled Front-End ที่เชื่อมต่อกับ Go Backend ผ่าน REST API เท่านั้น
2. อัตลักษณ์แบรนด์และระบบธีมสี (Brand Identity & Theme System)
อ้างอิงจากโลโก้แบรนด์ ส้มสิ่งพิมพ์ (SOM SING PHIM) โทนสีและสไตล์การออกแบบหลักมีดังนี้:
Primary Color (สีหลัก): น้ำเงินกรมท่าเข้ม (Navy Blue #0C2340, Dark Navy #07152B) สื่อถึงความน่าเชื่อถือ ความมืออาชีพ และคุณภาพ
Accent Color (สีเน้น/โลโก้): สีทอง/แชมเปญ (Gold/Champagne #C59B27, Light Gold #E2BD56) ใช้สำหรับปุ่มกด (Call-to-Action), ไฮไลต์ราคา, ไอคอน และองค์ประกอบตกแต่ง
Background Color (สีพื้นหลัง): ขาวบริสุทธิ์ (#FFFFFF) และเทาอ่อนสบายตา (Slate-50 #F8FAFC)
Text Color (สีตัวอักษร): เทาเข้ม (#1E293B) และขาว (#FFFFFF) เมื่ออยู่บนพื้นหลังสีน้ำเงิน
Typography (แบบอักษร): Sarabun / Noto Sans Thai อ่านง่าย ทันสมัย เหมาะกับภาษาไทยและภาษาอังกฤษ
3. โครงสร้างหน้าเว็บและสถาปัตยกรรม UI (Front-End Architecture & Pages)
3.1 Header & Navigation Bar (ส่วนหัวเว็บไซต์)
Logo Brand: โลโก้ "ส้มสิ่งพิมพ์ SOM SING PHIM" สีน้ำเงินตัดทอง
Category Navigation: เมนูหมวดหมู่สินค้า
Currency Switcher: ปุ่มสลับสกุลเงิน (เช่น THB ฿ / LAK ₭) ดึงค่าจากหลังบ้าน
Tracking Button: ปุ่มทางลัด "ติดตามสถานะงานพิมพ์"
Contact Social Links: ไอคอนเชื่อมต่อไปยัง Facebook, Instagram, TikTok, WhatsApp, และ Email
3.2 Homepage & Catalog Section (หน้าแรกและแคตตาล็อกสินค้า)
Hero Banner: ภาพแบนเนอร์นำเสนอคุณภาพงานพิมพ์ นำเสนอสโลแกนบริการงานพิมพ์ด่วนคุณภาพสูง
Best Seller Products (สินค้าขายดีที่สุด): ดึงข้อมูลสินค้าที่ขายดีที่สุดมาจากประวัติการซื้อขายในระบบหลังบ้าน (Automated Sales Data)
Product Categories (หมวดหมู่สินค้าหลัก):
อัลบั้มรูปภาพพรีเมียม (Photo Albums / Photo Printing)
กรอบรูปอะคริลิก & ตกแต่งบ้าน (Acrylic Frames / Decor)
สติ๊กเกอร์ไดคัท / ฉลากสินค้า (Cutout Stickers / Product Labels)
การ์ดเชิญ / โปสการ์ดที่ระลึก (Greeting Cards / Wedding Invitations)
งานพิมพ์หนังสือ / สมุด / เอกสาร (Booklets / Notebooks / Document Printing)
How It Works (4 ขั้นตอนสั่งซื้อง่ายๆ):
เลือกสินค้าและสเปก
แนบลิงก์ Google Drive
โอนเงินแนบสลิป
ติดตามสถานะรอรับสินค้า
3.3 Product Specification Configurator (หน้ารายละเอียดและเลือกสเปกสินค้า)
ปรับปรุงจากการเลือกสเปกแบบ Dropdown เป็น "Button Cards Grid" (ปุ่มกดเลือกออปชัน) เพื่อความสะดวกและเห็นตัวเลือกชัดเจน:
การเลือกขนาด (Size Selection): ปุ่มกดเลือก เช่น 4x6 นิ้ว, A4, A3+
การเลือกวัสดุ/กระดาษ (Material/Paper): ปุ่มกดเลือก เช่น กระดาษอาร์ตการ์ด 300g, สติ๊กเกอร์ PP กันน้ำ, อะคริลิกใส
การเลือกการเคลือบ/เทคนิคพิเศษ (Finishing/Add-ons): ปุ่มกดเลือก เช่น เคลือบด้าน (Matte), เคลือบเงา (Glossy), ปั๊มเคทอง (Foil Gold)
ช่องกรอกลิงก์ไฟล์งาน (Google Drive Link Input):
ช่องพิมพ์ตัวหนังสือสำหรับวาง URL
Mandatory Checkbox (บังคับติ๊ก): [✓] ข้าพเจ้ายืนยันว่าได้เปิดสิทธิ์การเข้าถึงลิงก์ Google Drive เป็นสาธารณะแล้ว (Anyone with the link can view)
ช่องหมายเหตุถึงช่างพิมพ์ (Special Instructions / Notes to Printer):
ช่อง Textarea สำหรับให้ลูกค้ากรอกคำขอพิเศษ เช่น "เว้นขอบขาว 1 ซม.", "เน้นสีโทนอุ่น", "ตัดแยกเป็นแผ่น"
Real-time Pricing Engine: คำนวณราคาสินค้าตามสเปกและจำนวนอัตโนมัติ
Mobile Sticky Bar: แถบสรุปราคาด้านล่างหน้าจอมือถือ พร้อมปุ่ม "ดำเนินการสั่งชำระเงิน" ติดหน้าจอตลอดเวลา
3.4 Checkout & Payment Flow (หน้าชำระเงินและข้อมูลจัดส่ง)
ข้อมูลผู้รับ (Recipient Details): ชื่อ-นามสกุล, เบอร์โทรศัพท์, ที่อยู่จัดส่ง
ตัวเลือกบริษัทขนส่ง (Shipping Couriers from Backend):
แสดงบริษัทขนส่งตามที่ระบบหลังบ้านเปิดใช้งาน (เช่น Flash Express, J&T, Kerry)
เงื่อนไขส่งฟรี/ค่าส่ง: ดึงเงื่อนไขจากระบบหลังบ้าน (เช่น สั่งซื้อครบยอด X บาท ส่งฟรี)
ข้อความระยะเวลาจัดส่ง: แสดงระบุไว้ว่า "ระยะเวลาจัดส่งขึ้นอยู่กับบริษัทขนส่ง"
PromptPay QR Code & Bank Transfer:
แสดง QR Code สแกนจ่ายเงินอัตโนมัติตามยอดรวม
แสดงเลขบัญชีธนาคารพร้อมปุ่มกด "คัดลอกเลขบัญชี" และ "คัดลอกยอดเงิน"
การแนบสลิปโอนเงิน (Payment Slip Upload):
ช่องอัปโหลดรูปภาพสลิปโอนเงิน
Live Preview System: แสดงตัวอย่างรูปสลิปให้ลูกค้าตรวจสอบความถูกต้องก่อนกดส่ง
Order Receipt Confirmation:
สรุปข้อมูลคำสั่งซื้อพร้อมแสดง Order ID (เช่น SSP-88291) ชัดเจน
ปุ่มกดเซฟ/แคปหน้าจอ หรือปุ่ม พิมพ์ใบสรุปคำสั่งซื้อ (PDF Summary)
3.5 Order Tracking Page (หน้าติดตามสถานะงานพิมพ์)
Simple Search: ค้นหาสถานะงานพิมพ์ด้วย Order ID เพียงอย่างเดียว (ไม่ต้องใช้เบอร์โทรศัพท์)
Real-time Status Timeline:
Received / Pending Slip Check (ได้รับออเดอร์แล้ว - รอแอดมินตรวจสอบสลิป)
Payment Approved (ยืนยันการชำระเงินแล้ว - แอดมินอนุมัติสลิป)
In Production (กำลังดำเนินการพิมพ์ / ขึ้นงาน)
Shipped / Delivered (จัดส่งเรียบร้อยแล้ว - แสดงเลข Tracking Number)
Urgent Assistance Button: ปุ่มกด "ติดต่อแอดมินผ่าน WhatsApp" สำหรับสอบถามเคสเร่งด่วนโดยแนบ Order ID ไปในแชตอัตโนมัติ
4. แผนผังการทำงานและการเชื่อมต่อระบบหลังบ้าน (Backend Integration - Go Language)
4.1 Data Flow & API Contract Overview
[Frontend (React/Vite)] ──(1) Get Products & Rates──> [Go Backend /pricing]
[Frontend (React/Vite)] ──(2) Submit Order & Slip───> [Go Backend /orders]
                                                           │
                                             (Admin Approve Slip in Dashboard)
                                                           │
[WhatsApp Cloud API] <──(3) Send Auto Message Notification─┘


4.2 Data Models & Endpoints Reference
Order Model (JSON Payload Example)
{
  "order_id": "SSP-88291",
  "customer_name": "คุณสมชาย ใจดี",
  "phone": "0812345678",
  "address": "123/45 ถนนสุขุมวิท กทม.",
  "product_id": "p1",
  "specs": {
    "size": "A4 (8.3x11.7 นิ้ว)",
    "paper": "กระดาษอาร์ตการ์ด 300g",
    "finishing": "เคลือบด้าน (Matte)"
  },
  "quantity": 2,
  "drive_link": "https://drive.google.com/drive/folders/sample-link",
  "is_permission_confirmed": true,
  "special_notes": "ขอเน้นสีสดใส เว้นขอบตัด 2 มม.",
  "shipping_courier_id": "flash_express",
  "shipping_fee": 40.00,
  "total_price": 740.00,
  "currency": "THB",
  "payment_slip_url": "data:image/png;base64,...",
  "status": "PENDING_SLIP_CHECK"
}
