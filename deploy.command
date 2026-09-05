#!/usr/bin/env bash

# ไปที่โฟลเดอร์ของโปรเจกต์อัตโนมัติ
cd "$(dirname "$0")"

SERVER_HOST="ASUS@100.116.116.18"
REMOTE_PATH="D:/Github/som-sing-phim-printing"

echo "========================================================"
echo "🚀 Som Sing Phim: Windows Server Deployment"
echo "🌐 Remote Server: $SERVER_HOST"
echo "📂 Remote Path:   $REMOTE_PATH"
echo "========================================================"
echo ""

# ตรวจสอบการเชื่อมต่อ SSH
echo "🔄 กำลังเชื่อมต่อไปยังเครื่อง Windows เพื่อดึงโค้ดและอัปเดต Docker..."
ssh "$SERVER_HOST" "cmd /c \"cd /d $REMOTE_PATH && git pull && docker compose up -d --build && docker image prune -f && docker compose ps\""

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================================"
    echo "✅ Deploy สำเร็จเรียบร้อยแล้วครับ!"
    echo "📱 หน้าร้าน (Customer): https://somsingphim.tail2bf83b.ts.net:5173"
    echo "🖥️ หลังบ้าน (Admin):     https://somsingphim.tail2bf83b.ts.net:3100"
    echo "⚙️ Backend API:         https://somsingphim.tail2bf83b.ts.net:8080"
    echo "🗄️ pgAdmin:             http://100.116.116.18:5050"
    echo "========================================================"
else
    echo ""
    echo "⚠️ เกิดข้อผิดพลาดในการเชื่อมต่อ SSH หรือรัน Docker"
    echo "💡 กรุณาตรวจสอบว่าคอมพิวเตอร์ Windows เปิดอยู่ และเชื่อมต่อ Tailscale แล้ว"
fi

echo ""
read -p "กดปุ่ม Enter เพื่อปิดหน้าต่าง..." dummy
