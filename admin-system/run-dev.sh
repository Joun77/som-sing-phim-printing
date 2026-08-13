#!/usr/bin/env bash
# ส้มสิ่งพิมพ์ SOM SING PHIM — รันทั้ง Backend (Go :8080) และ Frontend (Vite :5173) พร้อมกัน
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"

echo "=============================================="
echo "  ส้มสิ่งพิมพ์ SOM SING PHIM — Dev Runner"
echo "  Backend : Go REST API   -> http://localhost:8080"
echo "  Frontend: Vite + React  -> http://localhost:5173"
echo "=============================================="

# 1) ตรวจสอบ Go
if ! command -v go >/dev/null 2>&1; then
  echo "❌ ไม่พบ 'go' ในเครื่อง กรุณาติดตั้ง Go ก่อน (https://go.dev/dl/)"
  exit 1
fi

# 2) ตรวจสอบ node_modules ของ frontend
FRONTEND_DIR="$ROOT/../customer-service"
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "📦 ติดตั้ง dependencies ของ frontend ก่อน…"
  (cd "$FRONTEND_DIR" && npm install)
fi

echo "🚀 กำลังสตาร์ท backend + frontend… (Ctrl+C เพื่อหยุดทั้งหมด)"
cd "$FRONTEND_DIR" && npm run dev:all
