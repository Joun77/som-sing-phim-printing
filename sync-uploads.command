#!/usr/bin/env bash

# ไปที่โฟลเดอร์ของโปรเจกต์อัตโนมัติ
cd "$(dirname "$0")"

SERVER_HOST="ASUS@100.116.116.18"
REMOTE_PATH="D:/Github/som-sing-phim-printing/admin-system/backend/uploads"
LOCAL_PATH="admin-system/backend/uploads"

echo "========================================================"
echo "🖼️  Som Sing Phim: Sync Image Uploads to Windows Server"
echo "🌐 Remote Server: $SERVER_HOST"
echo "📂 Target Folder: $REMOTE_PATH"
echo "========================================================"
echo ""

if [ ! -d "$LOCAL_PATH" ]; then
    echo "⚠️  ไม่พบโฟลเดอร์ $LOCAL_PATH ในเครื่อง Mac"
    exit 1
fi

echo "📁 กำลังสร้างโฟลเดอร์ปลายทางบนเครื่อง Windows (หากยังไม่มี)..."
ssh "$SERVER_HOST" "cmd /c \"if not exist D:\Github\som-sing-phim-printing\admin-system\backend\uploads mkdir D:\Github\som-sing-phim-printing\admin-system\backend\uploads\""

echo "🚀 กำลังซิงค์ไฟล์รูปภาพทั้งหมดไปยังเครื่อง Windows..."
scp -r "$LOCAL_PATH"/* "$SERVER_HOST":"$REMOTE_PATH"/

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================================"
    echo "✅ ซิงค์ไฟล์รูปภาพไปยัง Windows Server สำเร็จแล้ว!"
    echo "📁 ตำแหน่งไฟล์บน Windows: D:\Github\som-sing-phim-printing\admin-system\backend\uploads"
    echo "========================================================"
else
    echo ""
    echo "⚠️ เกิดข้อผิดพลาดในการถ่ายโอนไฟล์ผ่าน SCP"
    echo "💡 กรุณาตรวจสอบว่าคอมพิวเตอร์ Windows เปิดอยู่ และเชื่อมต่อ Tailscale แล้ว"
fi

echo ""
read -p "กดปุ่ม Enter เพื่อปิดหน้าต่าง..." dummy
