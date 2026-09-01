# Task 39: Frontend JWT Auth Interceptor & Unified Docker-Terminal Dev Workflow

## 📌 Mission & Context

แก้ไขปัญหาข้อผิดพลาด `401 Unauthorized` ใน Console เมื่อ Frontend เรียก API ของ Admin ERP โดยการสร้าง Centralized Request Interceptor แนบ Bearer Token อัตโนมัติ พร้อมทั้งจัดทำแนวทางการรันและปรับแต่งโปรเจกต์ (Customization & Dev Workflow) ระหว่าง Docker (PostgreSQL, Redis/Queue) และ Local Terminal (Go Backend, Worker, Frontend) ให้ทำงานร่วมกันอย่างสมบูรณ์

---

## 🎯 สรุปการแบ่งระยะงาน (Phase Breakdown)

\[ Phase 1: Frontend JWT Interceptor & Auth Persistence \] ──► \[ Phase 2: Environment Configuration & CORS Setup \] ──► \[ Phase 3: Hybrid Dev Workflow (Docker DB \+ Terminal Apps) \]

---

## 🚀 รายละเอียดการดำเนินงานแต่ละเฟส (Detailed Specifications)

### 🔹 Phase 1: Frontend Request Interceptor & Token Attachment

- **Target Files:**  
    
  - `admin-system/frontend/src/api/client.ts` (หรือ `src/lib/api.ts` / `src/api/requests.ts`)  
  - `admin-system/frontend/src/store/useAuthStore.ts`


- **Technical Specs:**  
    
  1. สร้างหรือปรับปรุง Axios/Fetch Client กลาง:  
       
     import axios from 'axios';  
       
     import { useAuthStore } from '../store/useAuthStore';  
       
     export const apiClient \= axios.create({  
       
       baseURL: import.meta.env.VITE\_API\_URL || 'http://localhost:8080/api',  
       
       headers: {  
       
         'Content-Type': 'application/json',  
       
       },  
       
     });  
       
     // Request Interceptor: แนบ Token อัตโนมัติทุก Request  
       
     apiClient.interceptors.request.use((config) \=\> {  
       
       const token \= useAuthStore.getState().token || localStorage.getItem('token');  
       
       if (token) {  
       
         config.headers.Authorization \= \`Bearer ${token}\`;  
       
       }  
       
       return config;  
       
     }, (error) \=\> Promise.reject(error));  
       
     // Response Interceptor: จัดการกรณี Token หมดอายุ (401)  
       
     apiClient.interceptors.response.use(  
       
       (response) \=\> response,  
       
       (error) \=\> {  
       
         if (error.response?.status \=== 401\) {  
       
           useAuthStore.getState().logout();  
       
           // Redirect ไปหน้า Login ถ้าจำเป็น  
       
         }  
       
         return Promise.reject(error);  
       
       }  
       
     );  
       
  2. ใน `useAuthStore.ts`: ตรวจสอบให้แน่ใจว่าเมื่อ Login สำเร็จจะบันทึก Token ลงทั้ง Zustand State และ `localStorage`

---

### 🔹 Phase 2: Environment Variables & Backend CORS Configuration

- **Target Files:**  
    
  - `admin-system/backend/.env`  
  - `admin-system/backend/main.go`  
  - `admin-system/frontend/.env`  
  - `customer-service/.env`


- **Technical Specs:**  
    
  1. ใน `admin-system/backend/.env`:  
       
     PORT=8080  
       
     ENVIRONMENT=development  
       
     DATABASE\_URL=postgres://postgres:postgres@localhost:5432/somsin\_db?sslmode=disable  
       
     JWT\_SECRET=somsin\_super\_secret\_jwt\_key\_2026  
       
     ALLOWED\_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:3000  
       
     UPLOAD\_DIR=./uploads  
       
  2. ใน `admin-system/backend/main.go`:  
     - ตรวจสอบ CORS Middleware ให้รองรับ Origin ของทั้ง Admin (`http://localhost:5173` หรือ `5174`) และ Customer Service (`http://localhost:3000`)  
     - อนุญาต Headers: `Authorization, Content-Type, Accept, Origin`

---

### 🔹 Phase 3: Hybrid Development Workflow Setup

- **Target Files:**  
    
  - `docker-compose.dev.yml` (สร้างใหม่สำหรับรันเฉพาะ Database และ Redis)  
  - `Makefile` หรือ `scripts/dev.sh`


- **Technical Specs:**  
    
  1. สร้าง `docker-compose.dev.yml` สำหรับรันเฉพาะ Services พื้นฐาน:  
       
     version: '3.8'  
       
     services:  
       
       postgres:  
       
         image: postgres:16-alpine  
       
         container\_name: somsin-postgres  
       
         environment:  
       
           POSTGRES\_USER: postgres  
       
           POSTGRES\_PASSWORD: postgres  
       
           POSTGRES\_DB: somsin\_db  
       
         ports:  
       
           \- "5432:5432"  
       
         volumes:  
       
           \- pgdata:/var/lib/postgresql/data  
       
       redis:  
       
         image: redis:7-alpine  
       
         container\_name: somsin-redis  
       
         ports:  
       
           \- "6379:6379"  
       
     volumes:  
       
       pgdata:  
       
  2. ขั้นตอนการรันระบบแบบผสม (Hybrid Run):  
     - **Terminal 1 (Infrastructure):** `docker compose -f docker-compose.dev.yml up -d`  
     - **Terminal 2 (Go Backend API):** `cd admin-system/backend && go run main.go`  
     - **Terminal 3 (Go Worker Preflight):** `go run cmd/worker/main.go`  
     - **Terminal 4 (Admin Frontend):** `cd admin-system/frontend && npm run dev`  
     - **Terminal 5 (Customer Frontend):** `cd customer-service && npm run dev`

---

## 📋 Verification & Acceptance Criteria

- เปิดหน้า Admin ERP (`DashboardOverview.tsx`) แล้วไม่มี Request ใดติด Error `401 Unauthorized` ใน Console  
- บัญชี Admin สามารถดึงข้อมูล `/api/inbound`, `/api/customers`, `/api/spoilage` ได้ข้อมูลจริงอย่างสมบูรณ์  
- รัน PostgreSQL บน Docker Port 5432 และรัน Go Backend ผ่าน Local Terminal เชื่อมต่อฐานข้อมูลได้ราบรื่น

