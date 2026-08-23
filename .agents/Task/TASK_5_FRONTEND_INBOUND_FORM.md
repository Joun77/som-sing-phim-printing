# Task 5: Frontend API Client & Inbound Form UX

## Objective
ปรับปรุงส่วนต่อประสานผู้ใช้สำหรับการรับเข้าสินค้า ให้รองรับการเลือกสินค้าเดิมอัตโนมัติ (Auto-select Material ID) และแยกการส่ง Request ระหว่างการเติมสต็อกกับการแก้ไขข้อมูลสินค้า

## Target Files
- `frontend/src/features/inventory/api/inventoryApi.ts`
- `frontend/src/features/inventory/components/InboundFormModal.tsx`

## Technical Requirements
1. `frontend/src/features/inventory/api/inventoryApi.ts`:
   - เพิ่มฟังก์ชัน `createInbound(payload: CreateInboundPayload): Promise<InboundResponse>`
   - เพิ่มฟังก์ชัน `cancelInbound(id: string, payload: CancelInboundPayload): Promise<void>`
   - เพิ่มฟังก์ชัน `updateMaterialDirect(id: string, payload: UpdateMaterialPayload): Promise<MaterialResponse>`
2. `frontend/src/features/inventory/components/InboundFormModal.tsx`:
   - มี Dropdown/Combobox ค้นหาชื่อสินค้าเดิมเพื่อดึง `material_id` มาผูกกับ Payload อัตโนมัติ (แอดมินไม่ต้องจำ SKU)
   - มี Toggle ระหว่าง 'เติมสต็อกสินค้าเดิม' (ยิง `createInbound`) กับ 'สร้างสินค้าใหม่' (สร้าง SKU ใหม่)
   - ฟิลด์ราคาและจำนวนต้องรองรับการกรอกตัวเลขทศนิยมอย่างถูกต้อง