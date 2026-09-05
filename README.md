# 🖨️ Som Sing Phim — ระบบจัดการโรงพิมพ์

ระบบ ERP สำหรับโรงพิมพ์ Som Sing Phim ประกอบด้วย Admin System (หลังบ้าน), Customer Service (หน้าบ้าน), และ Go Backend API

---

## 📋 สารบัญ

- [ภาพรวมระบบ](#ภาพรวมระบบ)
- [URL การเข้าใช้งาน](#url-การเข้าใช้งาน)
- [การตั้งค่า Server ครั้งแรก](#การตั้งค่า-server-ครั้งแรก)
- [การพัฒนาจาก MacBook](#การพัฒนาจาก-macbook)
- [การ Deploy อัปเดต](#การ-deploy-อัปเดต)
- [คำสั่งที่ใช้บ่อย](#คำสั่งที่ใช้บ่อย)
- [การแก้ปัญหาเบื้องต้น](#การแก้ปัญหาเบื้องต้น)

---

## ภาพรวมระบบ

```
MacBook (Dev)  ──SSH/Git──►  Windows PC (Server)
                                    │
                              Docker Compose
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
              PostgreSQL      Go Backend      Nginx (Frontend)
              port 5432        port 8080      Admin  :3100
                                              Customer:5173
                                    │
                              Tailscale Funnel
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
          somsingphim.tail2bf83b.ts.net/    somsingphim.tail2bf83b.ts.net/admin
           (Customer Service)                  (Admin System)
```

---

## URL การเข้าใช้งาน

### 🌐 Public URL (เข้าได้จากทุกที่ ไม่ต้องติดตั้งอะไร)

| Service | URL |
|---------|-----|
| 🛒 Customer Service | `https://somsingphim.tail2bf83b.ts.net/` |
| 🖥️ Admin System | `https://somsingphim.tail2bf83b.ts.net/admin` |

### 🏠 Local Network (WiFi บ้านเดียวกัน)

| Service | URL |
|---------|-----|
| Customer Service | `http://192.168.100.43:5173` |
| Admin System | `http://192.168.100.43:3100` |
| Backend API | `http://192.168.100.43:8080` |
| Adminer (DB UI) | `http://192.168.100.43:8088` |
| pgAdmin | `http://192.168.100.43:5050` |

### 🔒 Tailscale VPN (ทุกที่ เฉพาะ Device ที่ Login)

| Service | URL |
|---------|-----|
| Customer Service | `http://100.116.116.18:5173` |
| Admin System | `http://100.116.116.18:3100` |
| Backend API | `http://100.116.116.18:8080` |

---

## การตั้งค่า Server ครั้งแรก

> ทำครั้งเดียวเท่านั้น ไม่ต้องทำซ้ำ

### 1. Requirements

- Windows PC พร้อม Docker Desktop ติดตั้งแล้ว
- Tailscale ติดตั้งและ Login แล้วทั้ง Mac และ Windows
- OpenSSH Server เปิดใช้งานแล้ว

### 2. Clone โปรเจกต์

```powershell
git clone https://github.com/Joun77/som-sing-phim-printing.git
cd som-sing-phim-printing
```

### 3. ตั้งค่า Environment

```powershell
Copy-Item .env.example .env
notepad .env
```

### 4. รัน Docker Stack

```powershell
docker compose up -d --build
```

### 5. เปิด Tailscale Funnel (Public Access)

```powershell
& "C:\Program Files\Tailscale\tailscale.exe" funnel --bg 5173
& "C:\Program Files\Tailscale\tailscale.exe" funnel --bg --set-path /admin 3100
```

---

## การพัฒนาจาก MacBook

### เชื่อมต่อ SSH เข้า Windows Server

```bash
# Local Network
ssh ASUS@192.168.100.43

# ผ่าน Tailscale (จากทุกที่)
ssh ASUS@100.116.116.18
```

---

## การ Deploy อัปเดต

### วิธีที่ 1 — ใช้ Script อัตโนมัติ (แนะนำ)

```bash
./deploy.sh "ข้อความ commit"
```

ตัวอย่าง:

```bash
./deploy.sh "แก้ไขหน้า Login"
./deploy.sh "เพิ่มฟีเจอร์ใบเสนอราคา"
```

### วิธีที่ 2 — Manual

```bash
# Push โค้ดขึ้น GitHub (บน Mac)
git add .
git commit -m "update feature"
git push

# SSH เข้า Server แล้ว Pull + Rebuild
ssh ASUS@100.116.116.18 "cd D:/Github/som-sing-phim-printing && git pull && docker compose up -d --build"
```

---

## คำสั่งที่ใช้บ่อย

### Docker

```powershell
docker compose ps                        # ดูสถานะ
docker compose logs -f                   # ดู Logs real-time
docker compose logs -f backend           # ดู Log เฉพาะ Service
docker compose restart backend           # Restart Service เดียว
docker compose down                      # หยุดทั้งหมด
docker compose up -d                     # รันใหม่ทั้งหมด
docker compose up -d --build             # Rebuild + รันใหม่
```

### Tailscale Funnel

```powershell
# ดูสถานะ
& "C:\Program Files\Tailscale\tailscale.exe" funnel status

# เปิด Funnel ใหม่
& "C:\Program Files\Tailscale\tailscale.exe" funnel --bg 5173
& "C:\Program Files\Tailscale\tailscale.exe" funnel --bg --set-path /admin 3100

# ปิดทั้งหมด
& "C:\Program Files\Tailscale\tailscale.exe" funnel off
```

### Database

```bash
# เข้า PostgreSQL
docker exec -it somsing_postgres psql -U postgres -d somsing_db

# Backup
docker exec somsing_postgres pg_dump -U postgres somsing_db > backup.sql

# Restore
docker exec -i somsing_postgres psql -U postgres somsing_db < backup.sql
```

---

## การแก้ปัญหาเบื้องต้น

### เว็บเข้าไม่ได้

```powershell
docker compose ps         # เช็ค Container
docker compose up -d      # Start ใหม่ถ้าหยุด
```

### SSL Error บน Tailscale URL

```powershell
& "C:\Program Files\Tailscale\tailscale.exe" funnel off
Start-Sleep -Seconds 3
& "C:\Program Files\Tailscale\tailscale.exe" funnel --bg 5173
& "C:\Program Files\Tailscale\tailscale.exe" funnel --bg --set-path /admin 3100
```

### SSH เข้าไม่ได้

```powershell
Get-Service sshd        # เช็คสถานะ
Start-Service sshd      # Start ถ้าหยุด
```

### Backend ต่อ Database ไม่ได้

```powershell
docker compose restart db
Start-Sleep -Seconds 5
docker compose restart backend
```

---

## ข้อมูล Server

| รายการ | ค่า |
|--------|-----|
| Docker | 27.2.0 |
| Tailscale IP | `100.116.116.18` |
| WiFi IP | `192.168.100.43` |
| SSH User | `ASUS` |
| Public URL | `somsingphim.tail2bf83b.ts.net` |

---

*อัปเดตล่าสุด: September 2026*
