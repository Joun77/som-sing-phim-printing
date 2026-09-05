#!/usr/bin/env bash
# ==============================================================================
# Som Sing Phim (ສົມສິ່ງພິມ) — Local to Cloud Database Sync Utility
# ==============================================================================
# เครื่องมือซิงค์ข้อมูลจาก PostgreSQL ในเครื่อง (Local Docker) ขึ้นสู่ Cloud Database
# รองรับ Render, Supabase, Neon, AWS RDS หรือ PostgreSQL โฮสต์ใดๆ ก็ได้
# ==============================================================================

set -euo pipefail

# สีสำหรับแสดงผล
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMP_DUMP="/tmp/somsing_db_sync_$(date +%s).sql"

cleanup() {
  if [[ -f "$TEMP_DUMP" ]]; then
    rm -f "$TEMP_DUMP"
  fi
}
trap cleanup EXIT

echo -e "${CYAN}${BOLD}"
echo "=================================================================="
echo "    🇱🇦 Som Sing Phim (ສົມສິ່ງພິມ) — Database Sync to Cloud"
echo "=================================================================="
echo -e "${NC}"

# 1. ตรวจสอบ Docker Container ของ Local PostgreSQL
CONTAINER_NAME="somsing_postgres"
echo -e "${BLUE}[1/5] ตรวจสอบ PostgreSQL ในเครื่อง (Local Docker)...${NC}"

if ! docker ps --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo -e "${YELLOW}⚠️  ไม่พบคอนเทนเนอร์ '${CONTAINER_NAME}' กำลังทำงานอยู่${NC}"
  echo -e "   กำลังสตาร์ทคอนเทนเนอร์ '${CONTAINER_NAME}'..."
  docker start "$CONTAINER_NAME" 2>/dev/null || (cd "$ROOT_DIR" && docker compose up -d db)
  sleep 3
fi

# ตรวจสอบการเข้าถึง Local DB
if ! docker exec "$CONTAINER_NAME" pg_isready -U postgres -d somsing_db >/dev/null 2>&1; then
  echo -e "${RED}❌ ไม่สามารถเชื่อมต่อกับ Local PostgreSQL ใน ${CONTAINER_NAME} ได้ กรุณาตรวจสอบ Docker${NC}"
  exit 1
fi
echo -e "${GREEN}✓ เชื่อมต่อ Local PostgreSQL (${CONTAINER_NAME}) สำเร็จ${NC}"

# 2. รับ Cloud Database URL จาก Argument หรือ Prompt
TARGET_URL="${1:-}"

if [[ -z "$TARGET_URL" ]]; then
  echo ""
  echo -e "${YELLOW}${BOLD}กรุณาระบุ External Connection String ของ Cloud Database (PostgreSQL):${NC}"
  echo -e "${CYAN}ตัวอย่าง (Render): postgres://somsing_user:password@dpg-xxxxx.singapore-postgres.render.com/somsing_db${NC}"
  echo -n -e "${BOLD}Database URL: ${NC}"
  read -r TARGET_URL
fi

# ตัดช่องว่าง
TARGET_URL="$(echo "$TARGET_URL" | xargs)"

if [[ -z "$TARGET_URL" ]]; then
  echo -e "${RED}❌ ไม่ได้ระบุ Database URL ยกเลิกการทำงาน${NC}"
  exit 1
fi

# ตรวจสอบว่ายังคงมี placeholder [YOUR-PASSWORD] อยู่หรือไม่
if [[ "$TARGET_URL" == *"[YOUR-PASSWORD]"* || "$TARGET_URL" == *"YOUR_PASSWORD"* ]]; then
  echo -e "${RED}❌ ตรวจพบคำว่า [YOUR-PASSWORD] ใน URL!${NC}"
  echo -e "${YELLOW}กรุณาใส่รหัสผ่านจริงของฐานข้อมูล Supabase แทนที่ [YOUR-PASSWORD] (ลบวงเล็บก้ามปูออกด้วย)${NC}"
  exit 1
fi

# ตรวจสอบ Supabase Direct Host (db.*.supabase.co ซึ่งเป็น IPv6-only)
if [[ "$TARGET_URL" =~ db\.([a-zA-Z0-9_-]+)\.supabase\.co ]]; then
  PROJECT_REF="${BASH_REMATCH[1]}"
  echo -e "${YELLOW}ℹ️  ตรวจพบ Supabase Direct Host (db.${PROJECT_REF}.supabase.co)${NC}"
  echo -e "${YELLOW}   หากระบบแจ้งเตือน 'Name has no usable address' แสดงว่าเน็ตเวิร์กไม่รองรับ IPv6${NC}"
fi

# เติม sslmode=require ถ้ายังไม่มีและเป็น Cloud Host
if [[ "$TARGET_URL" == *"render.com"* || "$TARGET_URL" == *"supabase.co"* || "$TARGET_URL" == *"supabase.com"* || "$TARGET_URL" == *"neon.tech"* ]]; then
  if [[ "$TARGET_URL" != *"sslmode="* ]]; then
    if [[ "$TARGET_URL" == *"?"* ]]; then
      TARGET_URL="${TARGET_URL}&sslmode=require"
    else
      TARGET_URL="${TARGET_URL}?sslmode=require"
    fi
  fi
fi

# 3. ทดสอบการเชื่อมต่อไปยัง Cloud Database
echo ""
echo -e "${BLUE}[2/5] ทดสอบการเชื่อมต่อไปยัง Cloud Database...${NC}"

TEST_OUTPUT=$(docker exec -i "$CONTAINER_NAME" psql "$TARGET_URL" -c "SELECT 1;" 2>&1 || true)

if ! echo "$TEST_OUTPUT" | grep -q "1"; then
  echo -e "${RED}❌ เชื่อมต่อไปยัง Cloud Database ไม่สำเร็จ!${NC}"
  echo -e "${YELLOW}ข้อความแจ้งเตือนจากฐานข้อมูล:${NC}"
  echo "$TEST_OUTPUT" | sed 's/^/  /'
  echo ""
  
  if echo "$TEST_OUTPUT" | grep -q "could not translate host name"; then
    if [[ -n "${PROJECT_REF:-}" ]]; then
      echo -e "${CYAN}${BOLD}💡 วิธีแก้ปัญหา IPv6 ของ Supabase:${NC}"
      echo -e "Supabase Direct URL เป็น IPv6-only ให้เปลี่ยนไปใช้ ${BOLD}Connection Pooler (IPv4)${NC} ดังนี้:"
      echo -e "${GREEN}postgresql://postgres.${PROJECT_REF}:<รหัสผ่านจริง>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres${NC}"
      echo ""
    fi
  fi

  echo -e "${YELLOW}ข้อแนะนำในการตรวจสอบ:${NC}"
  echo "  1. ตรวจสอบว่าคัดลอก External Connection String มาถูกต้องครบถ้วน"
  echo "  2. ตรวจสอบ Username, Password และ Database Name"
  echo "  3. ตรวจสอบว่า Cloud Database เปิดรับการเชื่อมต่อจากภายนอก (Allow external connections / IP allowlist)"
  exit 1
fi
echo -e "${GREEN}✓ ทดสอบเชื่อมต่อ Cloud Database สำเร็จ!${NC}"

# 4. เลือกโหมดการซิงค์
echo ""
echo -e "${BLUE}[3/5] เลือกโหมดการซิงค์ข้อมูล:${NC}"
echo "  1) Full Sync (Schema + Data) [แนะนำ]: ส่งโครงสร้างตารางและข้อมูลทั้งหมดไปทับให้ตรงกับ Local 100%"
echo "  2) Data Only (เฉพาะข้อมูล): ส่งเฉพาะข้อมูล Orders, Customers, Materials (ไม่ลบตารางเดิม)"
echo -n -e "${BOLD}เลือกโหมด (กด Enter เพื่อเลือก 1): ${NC}"
read -r SYNC_MODE
SYNC_MODE="${SYNC_MODE:-1}"

echo ""
echo -e "${BLUE}[4/5] กำลัง Export ข้อมูลจาก Local และนำเข้าสู่ Cloud Database...${NC}"

if [[ "$SYNC_MODE" == "1" ]]; then
  echo -e "   -> กำลัง Export โครงสร้างตารางและข้อมูลทั้งหมด (pg_dump --clean)..."
  docker exec "$CONTAINER_NAME" pg_dump -U postgres -d somsing_db --clean --if-exists > "$TEMP_DUMP"
  DUMP_SIZE=$(du -h "$TEMP_DUMP" | cut -f1)
  echo -e "   -> บันทึกไฟล์สำรองขนาด ${DUMP_SIZE} เรียบร้อย กำลังซิงค์ขึ้น Cloud..."
  docker exec -i "$CONTAINER_NAME" psql "$TARGET_URL" < "$TEMP_DUMP" >/dev/null 2>&1
else
  echo -e "   -> กำลัง Export เฉพาะข้อมูล (pg_dump --data-only --inserts)..."
  docker exec "$CONTAINER_NAME" pg_dump -U postgres -d somsing_db --data-only --inserts > "$TEMP_DUMP"
  DUMP_SIZE=$(du -h "$TEMP_DUMP" | cut -f1)
  echo -e "   -> บันทึกไฟล์สำรองขนาด ${DUMP_SIZE} เรียบร้อย กำลังซิงค์ขึ้น Cloud..."
  docker exec -i "$CONTAINER_NAME" psql "$TARGET_URL" < "$TEMP_DUMP" >/dev/null 2>&1
fi

echo -e "${GREEN}✓ ซิงค์ข้อมูลเข้าสู่ Cloud Database เรียบร้อยสมบูรณ์!${NC}"

# 5. ตรวจสอบความถูกต้องของข้อมูลบน Cloud Database
echo ""
echo -e "${BLUE}[5/5] รายงานข้อมูลบน Cloud Database หลังการซิงค์:${NC}"
docker exec -i "$CONTAINER_NAME" psql "$TARGET_URL" -c "
SELECT 'orders' AS table_name, count(*) AS total_rows FROM orders
UNION ALL SELECT 'order_items', count(*) FROM order_items
UNION ALL SELECT 'materials', count(*) FROM materials
UNION ALL SELECT 'public_products', count(*) FROM public_products
UNION ALL SELECT 'customers', count(*) FROM customers;
"

# 6. สอบถามเพื่อตั้งค่าให้ Local Backend เชื่อมกับ Cloud DB อัตโนมัติ
echo ""
echo -e "${CYAN}==================================================================${NC}"
echo -e "${YELLOW}${BOLD}คุณต้องการอัปเดตไฟล์ admin-system/backend/.env ให้ชี้เข้า Cloud DB เลยหรือไม่?${NC}"
echo -e "เมื่ออัปเดต Backend ในเครื่องของคุณจะอ่าน/เขียนข้อมูลตรงกับ Cloud Database ทันที"
echo -n -e "${BOLD}อัปเดตเลยหรือไม่? (y/N): ${NC}"
read -r UPDATE_ENV

if [[ "$UPDATE_ENV" =~ ^[Yy]$ ]]; then
  ENV_FILE="$ROOT_DIR/admin-system/backend/.env"
  if [[ -f "$ENV_FILE" ]]; then
    cp "$ENV_FILE" "${ENV_FILE}.backup"
    # แก้ไขค่า DATABASE_URL ใน .env
    if grep -q "^DATABASE_URL=" "$ENV_FILE"; then
      # ใช้ python หรือ awk เพื่อป้องกันปัญหาสเปเชียลคาแรกเตอร์ใน URL กับ sed บน macOS
      python3 -c "
import sys
with open('$ENV_FILE', 'r') as f:
    lines = f.readlines()
with open('$ENV_FILE', 'w') as f:
    for line in lines:
        if line.startswith('DATABASE_URL='):
            f.write('DATABASE_URL=$TARGET_URL\n')
        else:
            f.write(line)
"
    else
      echo "DATABASE_URL=$TARGET_URL" >> "$ENV_FILE"
    fi
    echo -e "${GREEN}✓ อัปเดต ${ENV_FILE} เรียบร้อยแล้ว (สร้างไฟล์สำรองที่ ${ENV_FILE}.backup)${NC}"
    echo -e "${GREEN}✓ ตอนนี้คุณสามารถรีสตาร์ต Backend ได้เลย ข้อมูลจะตรงกับ Cloud 100%!${NC}"
  fi
fi

echo ""
echo -e "${GREEN}${BOLD}🎉 การซิงค์ข้อมูลเสร็จสิ้นเรียบร้อย! ขอให้สนุกกับการพัฒนาครับ${NC}"
