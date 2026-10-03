# 🏢 Som Sing Printing - Admin ERP System

ระบบจัดการหลังบ้านสำหรับผู้ดูแลโรงพิมพ์สมสิงพิมพ์ (Som-Sing Phim Printing ERP)

---

## 🚀 Quick Start (เริ่มต้นใช้งานด่วน)

### 1. Front-end (React + Vite + TypeScript)
```bash
cd frontend
npm install
npm run dev
```

### 2. Back-end (Go Gin + PostgreSQL)
Running `npm run dev` inside `admin-system/frontend` starts only Vite. The backend
must also be running. The admin Vite server
forwards `/api` and `/uploads` to `http://localhost:8080`; an unavailable backend
produces HTTP 502. Start it from `admin-system/backend`, after approving the
startup effects below and supplying the existing approved configuration.

```bash
cd backend
# Use the existing exported environment and secret; do not print or replace them.
: "${ENVIRONMENT:?Set the approved environment explicitly before startup}"
: "${JWT_SECRET:?Supply the existing approved JWT secret before startup}"
[ "${#JWT_SECRET}" -ge 32 ] || { echo "JWT_SECRET must contain at least 32 characters" >&2; exit 1; }
PORT=8080 go run .
```

Go does not automatically load a `.env` file here. With a blank `ENVIRONMENT`
and missing or weak `JWT_SECRET`, startup intentionally exits before opening
port 8080. Do not bypass this guard or switch shop data to development/test
mode to restore login. Configure the intended PostgreSQL connection through
approved environment settings; the backend stops if the
database connection or canonical migration initialization fails.

**Startup effects:** imported settings packages can create local JSON files;
startup connects to PostgreSQL, automatically applies available migrations,
seeds location records, initializes notification clients, and starts the
maintenance job. Account-table initialization can also write to the database
and seed default users in development/test or blank environments. Obtain
approval for these effects before starting against shop data. A successful
compile or isolated test does not prove live login recovery.

---

## 📖 คู่มือฉบับเต็ม
สำหรับคู่มือการรันด้วย **Docker Compose** และขั้นตอนการ **Deploy ฟรีบน Supabase + Render + Vercel** แบบละเอียด สามารถดูได้ที่ [README หลักของโปรเจกต์ (Root README.md)](../README.md) ครับ

## Docker migration ownership

PostgreSQL initializes its database and volume without application SQL in
`docker-entrypoint-initdb.d`. The backend owns application migrations through
`db.RunMigrations`, using the canonical `admin-system/migrations` directory
packaged at `/app/migrations`. It stops before application services when
database connection or migration initialization fails.

The root Compose build supplies the named `canonical_migrations` context.
Equivalent standalone build from repository root:

```bash
docker buildx build --load \
  --build-context canonical_migrations=./admin-system/migrations \
  -f admin-system/backend/Dockerfile \
  -t somsing-backend:local ./admin-system/backend
```

This builds an image; it does not authorize running it against shop data.
Compose2.17+ and a builder supporting named contexts are required. Development
Compose is DB-only; application schema creation follows when the separately
authorized backend starts. A healthy PostgreSQL process alone does not prove
application schema readiness. Preserve existing volumes and migration records.
Do not run Down SQL, delete volumes or fabricate migration records to repair
a previously recorded incomplete schema. Such repair needs a separate audit
and approval.
