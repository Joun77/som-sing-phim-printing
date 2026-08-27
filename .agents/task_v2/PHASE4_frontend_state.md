# PHASE 4: Frontend Server State Refactor (TanStack Query)

## TASK 4.1: ลบ Global State Server Data ออกจาก Context
**รายละเอียด:**
- ไฟล์เป้าหมาย: `frontend/src/types.ts` และ `AppContext`
- ค่อยๆ ถอดการใช้ `useState` ในการเก็บ `orders`, `quotations`, และ `inventory` เพื่อป้องกันปัญหา Data Sync 

## TASK 4.2: สร้าง Hooks สำเร็จรูป (useQuery/useMutation)
**รายละเอียด:**
- ไฟล์เป้าหมาย: `frontend/src/features/` (แยกเป็น Hooks ของแต่ละ feature)
- เขียน `useOrders()`, `useUpdateOrder()`, `useQuotations()`, `useInventory()` โดยเรียกใช้ `@tanstack/react-query`
- ติดตั้ง `queryClient.invalidateQueries` เพื่อให้ดึงข้อมูลใหม่ทุกครั้งหลัง Mutation

## TASK 4.3: Refactor UI Components
**รายละเอียด:**
- เปลี่ยน Components ต่างๆ ให้มาใช้ Custom Hooks จาก Task 4.2 แทนการดึงจาก `AppContext`
- ปรับปรุง Loading / Error State ที่มาพร้อมกับ React Query
