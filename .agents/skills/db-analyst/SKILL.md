---
name: somsing-database-analyst
description: ทักษะและความเชี่ยวชาญสำหรับนักวิเคราะห์ฐานข้อมูล (Database Analyst & Architect) ในระบบ Som Sing Phim ครอบคลุมการออกแบบ Schema, Migration (up/down), ดัชนี (Indexing), Transaction Isolation, ความถูกต้องของข้อมูลสต็อกและบัญชี, และการจัดการข้อมูล JSONB ใน PostgreSQL
---

# Somsin Database Analyst Skill

ทักษะคู่มือนักวิเคราะห์และออกแบบฐานข้อมูล (Database Analyst / Architect) สำหรับระบบ **Som Sing Phim (สมสิงห์การพิมพ์)** ทำงานบนระบบจัดการฐานข้อมูล **PostgreSQL**

---

## 1. บทบาทและขอบเขตความรับผิดชอบ (Role & Scope)

- **การออกแบบโครงสร้างตาราง (Schema Design):** Normalization/Denormalization ที่เหมาะสมกับงาน ERP และ E-commerce
- **การจัดการไฟล์ Migration:** สร้างและตรวจสอบไฟล์ `migrations/NNN_<name>.up.sql` และ `migrations/NNN_<name>.down.sql`
- **การเพิ่มประสิทธิภาพการสืบค้น (Query Optimization & Indexing):** ออกแบบ Composite Indexes, Partial Indexes, และตรวจสอบ `EXPLAIN ANALYZE`
- **Data Integrity & Consistency:** ออกแบบ Foreign Keys, Check Constraints, Triggers (เช่น `trigger_set_timestamp()`) และการจัดเก็บข้อมูลแบบ Soft Delete

---

## 2. กฎเกณฑ์และมาตรฐานฐานข้อมูล (Database Standards & Conventions)

1. **คีย์หลักและการระบุตัวตน (Primary Keys):**
   - ใช้ `UUID` เป็นค่าเริ่มต้น โดยกำหนด `DEFAULT gen_random_uuid()` หรือ `uuid_generate_v4()`
   - รองรับ Extension `pgcrypto` หรือ `uuid-ossp`
2. **การบันทึกเวลา (Timestamps):**
   - ทุกตารางหลักต้องมีคอลัมน์:
     - `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
     - `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`
   - ผูก Trigger ให้เรียกใช้ฟังก์ชันอัปเดตเวลาอัตโนมัติเมื่อเกิดการแก้ไข
3. **การจัดการสถานะและ Soft Delete:**
   - ใช้ `is_active BOOLEAN NOT NULL DEFAULT true` หรือ `deleted_at TIMESTAMPTZ` สำหรับข้อมูลสำคัญ
   - ห้ามทำ Hard `DELETE` กับข้อมูลตารางหลัก (เช่น ลูกค้า, ประวัติการสั่งซื้อ, วัสดุคงคลัง) เพื่อรักษา Audit Trail
4. **ความถูกต้องทางการเงินและปริมาณสต็อก:**
   - ยอดเงิน/ราคา: ใช้ `NUMERIC(15, 2)` (หรือ `NUMERIC(18, 4)` สำหรับต้นทุนหน่วยย่อย) ห้ามใช้ `FLOAT` หรือ `DOUBLE PRECISION`
   - ปริมาณสต็อก: ใช้ `INTEGER` หรือ `NUMERIC(12, 2)` พร้อมใส่ Constraint `CHECK (current_stock >= 0)` ป้องกันสต็อกติดลบ

---

## 3. รูปแบบโค้ด Migration มาตรฐาน (Standard Migration Patterns)

### 3.1 ตัวอย่าง Up Migration (`migrations/NNN_create_table.up.sql`)

```sql
-- Up Migration: สร้างตารางและดัชนี
CREATE TABLE IF NOT EXISTS product_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name_lao VARCHAR(255) NOT NULL,
    name_thai VARCHAR(255),
    name_eng VARCHAR(255),
    category VARCHAR(100) NOT NULL,
    cost_per_unit NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- สร้าง Partial Index สำหรับข้อมูลที่ Active
CREATE INDEX IF NOT EXISTS idx_product_materials_category_active 
ON product_materials (category) WHERE is_active = true;

-- Trigger อัปเดต updated_at
CREATE TRIGGER set_timestamp_product_materials
BEFORE UPDATE ON product_materials
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();
```

### 3.2 ตัวอย่าง Down Migration (`migrations/NNN_create_table.down.sql`)

```sql
-- Down Migration: ล้างตารางและ Index ย้อนกลับอย่างปลอดภัย
DROP TRIGGER IF EXISTS set_timestamp_product_materials ON product_materials;
DROP INDEX IF EXISTS idx_product_materials_category_active;
DROP TABLE IF EXISTS product_materials CASCADE;
```

---

## 4. กลยุทธ์การออกแบบข้อมูลขั้นสูง (Advanced Storage Strategies)

- **Array (`TEXT[]` หรือ `VARCHAR[]`):** เหมาะสำหรับแท็กหรือคุณสมบัติแบบลิสต์สั้น ๆ เช่น รายชื่อหมวดหมู่ที่รองรับ, แท็กกระดาษ
- **JSONB:** ใช้สำหรับเก็บสเปกทางเทคนิคที่ยืดหยุ่นหรือการปรับแต่งเฉพาะ (Specifications / Metadata) โดยสร้าง `GIN` Index หากมีการค้นหาลึกลงไปใน Key บ่อยครั้ง:
  ```sql
  CREATE INDEX idx_materials_specs ON materials USING GIN (specs);
  ```
- **Single-Record Master Integrity:** ยึดหลัก 1 SKU ต่อ 1 แถวในตาราง Master และเก็บประวัติการรับเข้า/จ่ายออกในตารางประวัติธุรกรรม (Transaction Logs)

---

## 5. Checklist สำหรับ Database Analyst ก่อนส่งมอบงาน (Definition of Done)

- [ ] ทุกตารางมี Primary Key เป็น UUID และมี `created_at` / `updated_at`
- [ ] คอลัมน์ตัวเลขการเงินใช้ `NUMERIC` ไม่ใช้ `FLOAT`
- [ ] มี Constraint ควบคุม เช่น `CHECK (stock >= 0)`, `UNIQUE (code)`
- [ ] มี Migration ทั้ง `.up.sql` และ `.down.sql` ที่สอดคล้องกันและทดสอบ Rollback ได้จริง
- [ ] มี Index รองรับ Foreign Key และ Query ที่เรียกใช้บ่อย โดยเฉพาะ Partial Index สำหรับ Record ที่ Active
- [ ] ไม่มีการ Hard Delete ข้อมูลประวัติการทำธุรกรรม
