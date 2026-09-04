---
name: somsing-frontend-developer
description: ทักษะและความเชี่ยวชาญสำหรับนักพัฒนา Frontend ในระบบ Som Sing Phim (Admin ERP และ Customer Service Storefront) ครอบคลุม React, TypeScript, TanStack Query, Tailwind CSS, การเชื่อมต่อ API และกฎการออกแบบ UI/UX ประจำระบบ
---

# Somsin Frontend Developer Skill

ทักษะคู่มือนักพัฒนา Frontend สำหรับระบบโรงพิมพ์ **Som Sing Phim (สมสิงห์การพิมพ์)** ครอบคลุมการพัฒนาทั้งฝั่ง **Admin ERP** (`admin-system/frontend/`) และ **Customer Service Storefront** (`customer-service/`)

---

## 1. บทบาทและขอบเขตความรับผิดชอบ (Role & Scope)

- **Admin ERP (`admin-system/frontend/src/`):**
  - React 19 + TypeScript + Vite
  - State & Data Fetching: TanStack Query v5 + Zustand
  - Styling: Tailwind CSS + Lucide Icons (`lucide-react`)
  - ฟีเจอร์หลัก: จัดการคำสั่งซื้อ (Orders), คำนวณราคา (Pricing Engine), คลังวัสดุ/สินค้า (Inventory & Inbound), จัดการข้อมูลลูกค้า (Customers), จัดการข้อมูลแคตตาล็อกและสเปกวัสดุ (Dynamic Materials & Catalog)
- **Customer Service Storefront (`customer-service/src/`):**
  - React 18 + TypeScript + Vite
  - Styling: Clean Vanilla CSS / Scoped CSS Modules
  - สภาพแวดล้อม: รองรับ Responsive Mobile First, PWA, 3D Preview (Three.js), สถานะการติดตามออเดอร์ (Tracking)

---

## 2. กฎเหล็กสำคัญทาง Frontend (Universal Frontend Rules)

1. **NO EMOJIS ใน UI:**
   - ห้ามใช้ Unicode Emoji (เช่น 📦, 📄, ⚠️, ❌) ใน UI/Button/Modal เด็ดขาด
   - ให้ใช้ไอคอนจาก `lucide-react` เท่านั้น (เช่น `<Package />`, `<FileText />`, `<AlertTriangle />`, `<X />`)
2. **ภาษาและการแสดงผล (Lao & Multilingual Priority):**
   - ข้อความ UI ต้องรองรับภาษาลาว (Lao) เป็นหลัก ควบคู่กับไทย/อังกฤษ
   - ฟอนต์มาตรฐาน: `Noto Sans Lao` ควบคู่กับ `Inter` หรือ `Prompt`
3. **การแสดงผลตัวเลขและการเงิน (Currency & Number Formatting):**
   - **LAK (กีบลาว):** ปัดเศษเป็นจำนวนเต็มเสมอ (0 decimal places) เช่น `1,250,000 ₭`
   - **THB (บาทไทย):** แสดงทศนิยม 2 ตำแหน่งเสมอ เช่น `1,500.00 ฿`
   - จัดรูปแบบด้วย `Intl.NumberFormat` หรือฟังก์ชันยูทิลิตี้ประจำระบบ
4. **การจัดการ Type Safety:**
   - ห้ามใช้ `any` ทุกกรณี ต้องประกาศ TypeScript Interface ให้ตรงกับ Payload ของ Go Backend 100%
   - Interface ร่วมควรเก็บในโฟลเดอร์ `src/types/`

---

## 3. รูปแบบการพัฒนาที่ได้มาตรฐาน (Standard Development Patterns)

### 3.1 การดึงข้อมูลและจัดการสถานะด้วย TanStack Query v5

```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api'; // Axios หรือ Fetch instance

// Query Pattern
export function useMaterials(category?: string) {
  return useQuery({
    queryKey: ['materials', category],
    queryFn: async () => {
      const { data } = await api.get('/api/materials', { params: { category } });
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 นาที
  });
}

// Mutation Pattern พร้อม Invalidation
export function useUpdateMaterial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: MaterialUpdatePayload }) => {
      const { data } = await api.put(`/api/materials/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });
}
```

### 3.2 Modal, Form & Interactive Component Pattern

- มีสถานะ `isLoading`, `isSubmitting`, และ `isError` แสดงผลอย่างชัดเจนเสมอ
- ปุ่มกดยืนยันต้องมี Loading Spinner และ `disabled` เมื่อกำลังส่งข้อมูล
- มีการยืนยัน (Confirmation Dialog) ทุกครั้งก่อนการกระทำที่มีผลกระทบสูง (เช่น การลบ, การ Reversal สต็อก, การเปลี่ยนสถานะคำสั่งซื้อ)

### 3.3 การแยกชั้นระบบ (Domain Boundary)
- ห้าม Import ข้ามระหว่าง `admin-system/` และ `customer-service/`
- โค้ดแต่ละฝั่งต้องมีความเป็นเอกเทศ (Self-contained) หากต้องการแชร์ประเภทข้อมูล ให้กำหนด contract ผ่าน API หรือประกาศ types สอดคล้องกัน

---

## 4. Checklist สำหรับ Frontend ก่อนส่งมอบงาน (Definition of Done)

- [ ] ไม่มีการใช้ Emoji ในทุกหน้าจอ ใช้ `lucide-react` ครบถ้วน
- [ ] มี Type Safety ครบถ้วน ไม่มี `any`
- [ ] จัดรูปแบบสกุลเงินถูกต้อง (LAK 0 ทศนิยม, THB 2 ทศนิยม)
- [ ] มี Loading Skeletons / Spinners และ Error State ครบถ้วน
- [ ] Responsive รองรับทั้งหน้าจอ Desktop (Admin) และ Mobile (Storefront)
- [ ] Invalidate TanStack Query Cache หลัง Mutation สำเร็จ
- [ ] รันคำสั่ง `npm run build` หรือ `tsc --noEmit` ผ่านฉลุยโดยไม่มีข้อผิดพลาด
