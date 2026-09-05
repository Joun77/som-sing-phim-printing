#!/bin/bash
# deploy.sh — Script สำหรับ Deploy จาก MacBook ไป Windows Server

SERVER="ASUS@100.116.116.18"
PROJECT_PATH="D:/Github/som-sing-phim-printing"
COMMIT_MSG=${1:-"update"}

echo "🚀 กำลัง Deploy: $COMMIT_MSG"

# Step 1: Commit + Push
git add .
git commit -m "$COMMIT_MSG"
git push

# Step 2: SSH เข้า Server แล้ว Pull + Rebuild
echo "📦 กำลัง Build บน Server..."
ssh $SERVER "cd $PROJECT_PATH && git pull && docker compose up -d --build"

echo "✅ Deploy เสร็จแล้ว!"
echo "🌐 เข้าใช้งานได้ที่: https://somsingphim.tail2bf83b.ts.net"
