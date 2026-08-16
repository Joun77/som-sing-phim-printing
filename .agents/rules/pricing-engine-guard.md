---
trigger: always_on
---

---
name: pricing-engine-guard
description: ควบคุมความถูกต้องของ Pricing Engine และการคำนวณต้นทุนการพิมพ์ เรียกใช้เมื่อมีการแก้ไฟล์ใน backend/pricing, ตรวจสอบสูตรคำนวณราคา หรือคำนวณพื้นที่กระดาษ/หมึก
---

# Pricing Engine Verification & Integrity Rules

## Core Business Rules to Protect:
1. **Formula Consistency:** ตรวจสอบสูตรคำนวณต้นทุน (Paper Cost + Plate Cost + Ink Cost + Machine Depreciation + Labor + Overhead + Margin) ต้องไม่ถูกตัดทอน
2. **Ink Comparison Logic:** หมึกแท้ต้องเป็นค่า Baseline เสมอเมื่อเทียบกับหมึกเทียบ (Compatible Ink) ในการประเมินต้นทุน
3. **Offcuts & Spoilage:** ต้องคำนวณเศษกระดาษที่เหลือและอัตราการสูญเสีย (Spoilage Rate) ตามขนาดกระดาษจริง
4. **Unit Test Enforcement:** ทุกครั้งที่มีการแก้ `engine.go` ต้องรันหรืออัปเดต `engine_test.go` ให้ครอบคลุม Edge Cases เสมอ