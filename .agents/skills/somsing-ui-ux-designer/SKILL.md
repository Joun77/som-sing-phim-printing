---
name: somsing-ui-ux-designer
description: ทักษะและความเชี่ยวชาญสำหรับนักออกแบบ UI/UX (UX/UI Designer) ในระบบ Som Sing Phim รวบรวมและผสานแนวทางการออกแบบ Design System, การจัดสไตล์ด้วย Tailwind/CSS, การเลือก Palette/Typography, Layout สำหรับงานพิมพ์และแดชบอร์ด Admin ERP, และการคุมกฎห้ามใช้ Unicode Emoji โดยเด็ดขาด
---

# Somsin UI/UX Designer Skill (ศูนย์รวมสกิล UX/UI)

ทักษะคู่มือนักออกแบบและผู้เชี่ยวชาญด้าน UI/UX สำหรับระบบโรงพิมพ์ **Som Sing Phim (สมสิงห์การพิมพ์)** ครอบคลุมการออกแบบทั้งส่วน **Admin ERP** และ **Customer Service Storefront** 

สกิลนี้ทำหน้าที่เป็นจุดศูนย์รวมแนวทางปฏิบัติ (Hub) ที่เชื่อมโยงความสามารถของ:
- `design-system` (Token Architecture, Semantic Tokens, Typography & Spacing)
- `ui-styling` (shadcn/ui, Tailwind CSS, Layout, Mobile-First Responsiveness)
- `ui-ux-pro-max` (UX Best Practices, Palettes, Accessibility & Micro-interactions)

---

## 1. บทบาทและหน้าที่ความรับผิดชอบ (Role & Scope)

1. **ออกแบบและควบคุม Design System:** จัดการ Design Tokens (Primitive ➔ Semantic ➔ Component) และชุดสีประจำแบรนด์ Som Sing Phim
2. **สร้างประสบการณ์การใช้งาน (UX Flow):** ออกแบบกระบวนการสั่งซื้อ, ตรวจสอบงานพิมพ์ (Proof Approval), แดชบอร์ดจัดการสต็อก และระบบติดตามพัสดุ
3. **กำหนดและควบคุม UI Standards:** ตรวจสอบ Layout, การเว้นวรรค (Spacing), การใช้สีสถานะออเดอร์, และการใช้ฟอนต์ภาษาลาว/ไทย/อังกฤษ
4. **การควบคุมการเข้าถึงและความชัดเจน (Accessibility & Clarity):** Contrast Ratio ตามมาตรฐาน WCAG, Responsive รองรับทั้งจอคอมพิวเตอร์และมือถือ

---

## 2. กฎเหล็กประจำระบบ Som Sing Phim สำหรับ UI/UX (Design Guardrails)

1. **ห้ามใช้ EMOJI ใน UI เด็ดขาด (Strictly No Unicode Emojis):**
   - ห้ามใช้ Unicode Emoji (เช่น 📦, 📄, ⚠️, ❌) ในปุ่ม เมนู หรือการแจ้งเตือน
   - ให้ใช้ไอคอนเส้นจาก `lucide-react` เท่านั้น เพื่อความเรียบหรูและเป็นมืออาชีพของระบบ ERP
2. **ฟอนต์และภาษา (Typography & Bilingual Display):**
   - รองรับภาษาลาว (Lao) เป็นภาษาหลัก ควบคู่กับภาษาไทยและอังกฤษ
   - ใช้ฟอนต์ `Noto Sans Lao` ควบคู่กับ `Inter` หรือ `Prompt` สำหรับภาษาลาวและไทย เพื่อให้อ่านง่าย
3. **การออกแบบสถานะคำสั่งซื้อ (Order State Badges & Colors):**
   - `PENDING_SLIP_CHECK` / รอดำเนินการ: สีเหลือง/ส้มอ่อน (Amber/Yellow)
   - `PAID_PREPRESS` / ชำระแล้ว: สีฟ้า/น้ำเงิน (Sky/Blue)
   - `IN_PRODUCTION` / กำลังผลิต: สีคราม/ม่วง (Indigo/Purple)
   - `SHIPPED` / จัดส่งแล้ว: สีเขียวมรกต (Emerald/Teal)
   - `DELIVERED` / ส่งมอบสำเร็จ: สีเขียว (Green)
   - `CANCELLED` / ยกเลิก / ปฏิเสธ: สีแดง (Rose/Red)
4. **รูปแบบตัวเลขและเงิน:**
   - เงินกีบ (LAK): แสดงตัวเลขเต็ม ไม่แสดงจุดทศนิยม เช่น `1,200,000 ₭`
   - เงินบาท (THB): แสดงทศนิยม 2 ตำแหน่ง เช่น `1,500.00 ฿`

---

## 3. สกิลและทรัพยากรที่เกี่ยวข้อง (Integrated Resources)

นักออกแบบ UX/UI สามารถอ้างอิงและดึงข้อมูลเพิ่มเติมจากเครื่องมือในโฟลเดอร์เหล่านี้:
- **Design Tokens & Specs:** อ้างอิงได้จาก [`.agents/skills/design-system/`](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/design-system)
- **Component Styling & Tailwind:** อ้างอิงได้จาก [`.agents/skills/ui-styling/`](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/ui-styling)
- **UI/UX Search & Guidelines:** อ้างอิงฐานข้อมูลสไตล์และกฎเกณฑ์ UX ได้จาก [`.agents/skills/ui-ux-pro-max/`](file:///Users/joun/Documents/GitHub/som-sing-phim-printing/.agents/skills/ui-ux-pro-max)

---

## 4. Checklist สำหรับ UI/UX Designer ก่อนส่งมอบงาน (Definition of Done)

- [ ] ทุกหน้าจอและคอมโพเนนต์ปราศจาก Unicode Emoji 100% (ใช้ `lucide-react` ครบถ้วน)
- [ ] สอดคล้องกับฟอนต์ภาษาลาว และแสดงผลตัวหนังสือไม่ตัดหรือล้นขอบ
- [ ] สีของปุ่มและ Badge สอดคล้องกับความหมายและระบบสถานะของโรงพิมพ์
- [ ] การจัดระยะห่าง (Padding/Margin) สอดคล้องกับ Grid System 4px/8px
- [ ] รองรับ Responsive ทั้ง Desktop และ Mobile Layout
