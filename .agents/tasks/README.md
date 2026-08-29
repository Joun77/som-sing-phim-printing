# Som Sing Phim - Master Development Roadmap (.agents/tasks)

แผนงานพัฒนาระบบหลังบ้าน (Admin System) สำหรับโรงพิมพ์สมสิงห์พิมพ์ แบบ Lean & High Efficiency สำหรับการบริหารจัดการออเดอร์ การตรวจสลิป การแก้ไขสเปก และการควบคุมสต็อกอย่างมืออาชีพ

---

## สรุปรายการงาน (Task Master Index)

| Task File | ชื่อภารกิจ (Task Title) | วัตถุประสงค์หลัก & ขอบเขตงาน | สถานะ |
| :--- | :--- | :--- | :---: |
| [task-01-quick-actions-edit-button.md](file:///.agents/tasks/task-01-quick-actions-edit-button.md) | **Task 01: Quick Actions & Edit Button** | เพิ่มปุ่มแก้ไขใน Quick Actions (4 ปุ่มครบชุด), ปรับ Layout ตารางออเดอร์ และเชื่อมต่อ Trigger Modal | ⏳ Ready |
| [task-02-multi-step-edit-order-modal.md](file:///.agents/tasks/task-02-multi-step-edit-order-modal.md) | **Task 02: Multi-Step Edit Order Modal** | โมดัลแก้ไขออเดอร์ขนาดใหญ่ 3 ขั้นตอน (ลูกค้า ➔ สเปกสินค้า ➔ สรุปยอดเงิน) พร้อมระบบ Stock Guard ล็อกสเปกเมื่อตัดสต็อกแล้ว | ⏳ Ready |
| [task-03-universal-bank-slip-verification.md](file:///.agents/tasks/task-03-universal-bank-slip-verification.md) | **Task 03: Universal Bank Slip Verification** | ระบบตรวจสลิปโอนเงินทุกธนาคาร + Lightbox Zoom และปุ่มอัปโหลดสลิปสำหรับออเดอร์ที่แอดมินสร้างเอง | ⏳ Ready |
| [task-04-customer-artwork-specs-viewer.md](file:///.agents/tasks/task-04-customer-artwork-specs-viewer.md) | **Task 04: Real Artwork Viewer & Specs** | แสดงสเปกงานพิมพ์ทุก Job ชัดเจน และปุ่มเปิดดู/ดาวน์โหลดไฟล์งานอาร์ตเวิร์กจริง (External Link + Modal Preview) | ⏳ Ready |
| [task-05-design-system-emoji-cleanup-qa.md](file:///.agents/tasks/task-05-design-system-emoji-cleanup-qa.md) | **Task 05: Emoji Cleanup & End-to-End QA** | กวาดล้าง Text Emoji ออกทั้งหมด แทนที่ด้วย Lucide Icons ระดับพรีเมียม และทดสอบ Build / Test ครอบคลุม | ⏳ Ready |

---

## กฎเหล็กประจำทุก Task (Universal Guardrails)

1. **NO EMOJIS:** ห้ามใช้อีโมจิแบบ Text (เช่น 📑, 🎨, ⚠️, ❌, ✂️, ✓, ⏳) ใน UI และโค้ดเด็ดขาด ให้ใช้ `lucide-react` เท่านั้น
2. **LAO LANGUAGE STANDARD:** ข้อความฝั่งผู้ใช้ทั้งหมดในภาษาหลักต้องเป็น **ภาษาลาว** อย่างถูกต้องตามศัพท์เทคนิคการพิมพ์ (ห้ามมีภาษาไทยปะปนใน UI)
3. **STRICT SCOPE ISOLATION:** ห้ามแตะต้องโมดูลอื่นที่ทำงานสมบูรณ์แล้ว (`backend/pricing/`, `catalog`, `finance`, `hr`, `inbound`, `ProductionBoard`)
4. **STOCK INTEGRITY GUARD:** ห้ามแก้ไขหรือยกเลิกการตัดสต็อกของออเดอร์ที่อยู่ในสถานะ `IN_PRODUCTION` แล้วเด็ดขาด
5. **STEP-BY-STEP EXECUTION:** ให้ผู้ใช้สั่งรันและตรวจทีละ Task ตามลำดับอย่างเคร่งครัด
