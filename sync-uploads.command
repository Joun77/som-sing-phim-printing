#!/usr/bin/env bash

# ไปที่โฟลเดอร์ของโปรเจกต์อัตโนมัติ
cd "$(dirname "$0")"

REMOTE_PATH="D:/Github/som-sing-phim-printing/admin-system/backend/uploads"
LOCAL_PATH="admin-system/backend/uploads"

echo "========================================================"
echo "🖼️  Som Sing Phim: Sync Image Uploads to Windows Server"
echo "========================================================"

# ตรวจสอบการเชื่อมต่ออัตโนมัติ (LAN 192.168.100.43 หรือ Tailscale 100.116.116.18)
SERVER_IP=""
if nc -z -G 1 192.168.100.43 22 2>/dev/null; then
    SERVER_IP="192.168.100.43"
    echo "⚡ เชื่อมต่อผ่าน Local Wi-Fi (192.168.100.43) รวดเร็วระดับ Local Network"
elif nc -z -G 2 100.116.116.18 22 2>/dev/null; then
    SERVER_IP="100.116.116.18"
    echo "🌐 เชื่อมต่อผ่าน Tailscale VPN (100.116.116.18)"
else
    echo "❌ ไม่สามารถติดต่อเครื่องคอมพิวเตอร์ Windows ได้!"
    echo "💡 แนะนำ: เปิดแอป Tailscale บน Mac หรือเชื่อมต่อ Wi-Fi เดียวกัน (192.168.100.x)"
    echo ""
    read -p "กดปุ่ม Enter เพื่อปิดหน้าต่าง..." dummy
    exit 1
fi

SERVER_HOST="ASUS@$SERVER_IP"
echo "🌐 เซิร์ฟเวอร์ปลายทาง: $SERVER_HOST"
echo "📂 โฟลเดอร์ปลายทาง:   $REMOTE_PATH"
echo "--------------------------------------------------------"

if [ ! -d "$LOCAL_PATH" ]; then
    echo "⚠️  ไม่พบโฟลเดอร์ $LOCAL_PATH ในเครื่อง Mac"
    exit 1
fi

echo "📁 กำลังเตรียมโฟลเดอร์บนเครื่อง Windows..."
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
    echo "💡 หากมีถาม Password ให้ใส่รหัสผ่านล็อกอินของเครื่อง Windows (ASUS)"
fi

echo ""
read -p "กดปุ่ม Enter เพื่อปิดหน้าต่าง..." dummy
