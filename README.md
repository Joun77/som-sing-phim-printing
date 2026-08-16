# 🖨️ Som Sing Printing ERP (ສົມສິ່ງພິມ)
> ระบบบริหารจัดการโรงพิมพ์ครบวงจร (ERP & CRM Printing Management System) สำหรับโรงพิมพ์ **ສົມສິ່ງພິມ (Som Sing Printing)**

---

## 📑 สารบัญ
1. [โครงสร้างโปรเจกต์ (Project Structure)](#-โครงสร้างโปรเจกต์-project-structure)
2. [วิธีรันในเครื่อง (Local Development)](#-วิธีรันในเครื่อง-local-development)
   - [วิธีที่ 1: รันด้วย Docker Compose (แนะนำ รวดเร็วที่สุด)](#วิธีที่-1-รันด้วย-docker-compose-แนะนำและง่ายที่สุด)
   - [วิธีที่ 2: รันแยกทีละส่วน (Manual Mode)](#วิธีที่-2-รันแยกทีละส่วน-manual-mode)
3. [วิธี Deploy ขึ้น Production (แบบฟรี 100%)](#-วิธี-deploy-ขึ้น-production-แบบฟรี-100)
   - [ขั้นตอนที่ 1: สร้างฐานข้อมูล PostgreSQL (Supabase)](#ขั้นตอนที่-1-สร้างฐานข้อมูล-postgresql-บน-supabase)
   - [ขั้นตอนที่ 2: Deploy Go Back-end (Render / Koyeb)](#ขั้นตอนที่-2-deploy-go-back-end-api-บน-render--koyeb)
   - [ขั้นตอนที่ 3: Deploy Front-end (Vercel / Netlify)](#ขั้นตอนที่-3-deploy-front-end-บน-vercel--netlify)
4. [ตาราง Environment Variables](#-ตาราง-environment-variables)

---

## 📁 โครงสร้างโปรเจกต์ (Project Structure)

```text
som-sing-phim-printing/
├── admin-system/                  # ระบบจัดการหลังบ้านสำหรับผู้ดูแลโรงพิมพ์
│   ├── backend/                   # Go Gin REST API + SSE + PDF Generator
│   ├── frontend/                  # React (Vite + TypeScript + Tailwind CSS)
│   └── migrations/                # สคริปต์ฐานข้อมูล PostgreSQL (SQL Files)
├── customer-service/              # เว็บไซต์หน้าบ้านสำหรับลูกค้า (คำนวณราคา & ติดตามออเดอร์)
├── docker-compose.yml             # ไฟล์จัดการ Container รันทั้งระบบ
└── render.yaml                    # Blueprint สำหรับ One-Click Deploy บน Render.com
```

---

## 💻 วิธีรันในเครื่อง (Local Development)

### วิธีที่ 1: รันด้วย Docker Compose (แนะนำและง่ายที่สุด)
รันทุกอย่าง (Database + Go Backend + Admin Frontend + Customer Portal) ด้วยคำสั่งเดียว:

```bash
# 1. สั่ง Build และเริ่มต้น Container
docker compose up --build
```

**บริการทั้งหมดจะพร้อมใช้งานที่:**
* **Admin Frontend:** [http://localhost:3000](http://localhost:3000)
* **Customer Service Portal:** [http://localhost:5173](http://localhost:5173)
* **Go Backend API:** [http://localhost:8080](http://localhost:8080)
* **PostgreSQL Database:** `localhost:5432`

---

### วิธีที่ 2: รันแยกทีละส่วน (Manual Mode)

#### 1. เปิดฐานข้อมูล PostgreSQL
ตรวจสอบให้แน่ใจว่าเครื่องของคุณมี PostgreSQL ทำงานอยู่ที่พอร์ต `5432` หรือใช้ Docker:
```bash
docker run -d --name somsing_db -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=somsing_db postgres:15-alpine
```

#### 2. รัน Go Back-end API
```bash
cd admin-system/backend

# ดาวน์โหลด Go Dependencies
go mod tidy

# รันเซิร์ฟเวอร์ Go
go run main.go
# เซิร์ฟเวอร์จะเริ่มทำงานที่ http://localhost:8080
```

#### 3. รัน Admin Front-end
```bash
cd admin-system/frontend

# ติดตั้ง Dependencies
npm install

# รัน Dev Server
npm run dev
# เปิดใช้งานได้ที่ http://localhost:5173 หรือ URL ที่ Vite แจ้ง
```

#### 4. รัน Customer Service Portal (หากต้องการ)
```bash
cd customer-service
npm install
npm run dev
```

---

## 🚀 วิธี Deploy ขึ้น Production (แบบฟรี 100%)

แผนผังสถาปัตยกรรมสำหรับ Production:
```text
[ Browser ] ───► [ Vercel / Netlify (Front-end) ]
                        │
                        ▼ (ยิง API HTTPS)
                 [ Render / Koyeb (Go Back-end) ]
                        │
                        ▼ (PostgreSQL Connection)
                 [ Supabase (PostgreSQL Database) ]
```

---

### ขั้นตอนที่ 1: สร้างฐานข้อมูล PostgreSQL บน Supabase

1. สมัครและเข้าสู่ระบบที่ [Supabase.com](https://supabase.com)
2. สร้างโปรเจกต์ใหม่ (เลือก Region **Singapore** เพื่อความเร็วสูงสุดในไทย/ลาว)
3. ไปที่เมนู **SQL Editor** ใน Supabase:
   * เปิดไฟล์ในโฟลเดอร์ `admin-system/migrations/` (เช่น `001_master_printer_ink_paper_quotation_spec.sql`, `002_employees_offcuts_inbound.sql`, ฯลฯ)
   * คัดลอกโค้ด SQL มาวางแล้วกด **Run** เพื่อสร้างตารางทั้งหมด
4. ไปที่ **Project Settings > Database > Connection String (URI)**:
   * เลือกโหมด **Transaction** หรือ **Session**
   * คัดลอก Connection URI เก็บไว้ (เช่น `postgresql://postgres:[YOUR-PASSWORD]@db.[REF].supabase.co:5432/postgres?sslmode=require`)

---

### ขั้นตอนที่ 2: Deploy Go Back-end API บน Render / Koyeb

#### ตัวเลือกที่ 2.1: Deploy บน Render (render.com)
1. ไปที่ [Render.com](https://render.com) แล้วสร้าง **New > Web Service**
2. เชื่อมต่อกับ GitHub Repository นี้
3. ตั้งค่าการ Build:
   * **Name:** `somsing-backend`
   * **Root Directory:** `admin-system/backend`
   * **Environment:** `Docker` (หรือเลือก `Go` แล้วใส่ Build Command `go build -o server .` / Start Command `./server`)
   * **Instance Type:** `Free`
4. เพิ่ม **Environment Variables**:
   * `DATABASE_URL` = `<Connection_URI_จาก_Supabase>`
   * `GIN_MODE` = `release`
   * `PORT` = `8080`
5. กด **Create Web Service** แล้วรอ Deploy เสร็จ คุณจะได้ URL ของ Backend (เช่น `https://somsing-backend.onrender.com`)

---

### ขั้นตอนที่ 3: Deploy Front-end บน Vercel / Netlify

#### สำหรับ Admin System Front-end:
1. เข้าไปที่ [Vercel.com](https://vercel.com) แล้วกด **Add New > Project**
2. เลือก GitHub Repository นี้
3. ตั้งค่าโปรเจกต์:
   * **Framework Preset:** `Vite`
   * **Root Directory:** กด Edit แล้วเลือกโฟลเดอร์ `admin-system/frontend`
   * **Build Command:** `npm run build`
   * **Output Directory:** `dist`
4. เพิ่ม **Environment Variable**:
   * `VITE_API_BASE_URL` = URL ของ Back-end เช่น `https://somsing-backend.onrender.com/api`
5. กด **Deploy**

#### สำหรับ Customer Service Portal:
* ทำเหมือนกันโดยตั้งค่า **Root Directory** เป็น `customer-service`

---

## ⚙️ ตาราง Environment Variables

### Back-end (`admin-system/backend`)
| Variable | คำอธิบาย | ตัวอย่างค่า |
| :--- | :--- | :--- |
| `DATABASE_URL` | PostgreSQL Connection URI | `postgresql://postgres:pass@host:5432/dbname?sslmode=require` |
| `PORT` | พอร์ตที่ API ทำงาน | `8080` |
| `GIN_MODE` | โหมดการทำงานของ Gin Framework | `release` (บน Production) หรือ `debug` |

### Front-end (`admin-system/frontend` & `customer-service`)
| Variable | คำอธิบาย | ตัวอย่างค่า |
| :--- | :--- | :--- |
| `VITE_API_BASE_URL` | Base URL ชี้ไปยัง Go API | `https://somsing-backend.onrender.com/api` |

---

## 👤 โหมดผู้ดูแลระบบ (Admin Access)
* ในโหมดทดสอบปัจจุบัน ระบบได้ทำการ **Bypass Login** ไว้เพื่อให้สามารถเปิดดูหน้าแดชบอร์ดและฟังก์ชันต่างๆ ได้ทันที
* ข้อมูลโปรไฟล์เริ่มต้น: **ສົມສິ່ງພິມ (Owner Full Access)**
