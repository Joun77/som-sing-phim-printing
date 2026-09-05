#!/usr/bin/env bash

# ไปที่โฟลเดอร์ของโปรเจกต์อัตโนมัติ
cd "$(dirname "$0")"

echo "========================================================"
echo "🚀 Som Sing Phim: Windows Server Deployment"
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
    echo ""
    echo "💡 สาเหตุที่เป็นไปได้:"
    echo "  1. แอป Tailscale บนเครื่อง Mac นี้ถูกปิดอยู่ (Status: Stopped) ให้เปิดแอป Tailscale แล้วกด Connect"
    echo "  2. หรือ เครื่อง Mac กับคอมพิวเตอร์ Windows ไม่ได้ต่อ Wi-Fi วงเดียวกัน (192.168.100.x)"
    echo "  3. หรือ เครื่องคอมพิวเตอร์ Windows หลับ/ปิดอยู่"
    echo ""
    read -p "กดปุ่ม Enter เพื่อปิดหน้าต่าง..." dummy
    exit 1
fi

SERVER_HOST="ASUS@$SERVER_IP"
echo "🌐 กำลังสั่งงานไปยัง: $SERVER_HOST"
echo "📂 โฟลเดอร์ปลายทาง:   D:/Github/som-sing-phim-printing"
echo "--------------------------------------------------------"

echo "🔄 กำลังเชื่อมต่อไปยังเครื่อง Windows เพื่อดึงโค้ดและอัปเดต Docker..."
# ใช้ Single Quotes เพื่อป้องกัน Bash แปลงเครื่องหมาย Backslash (\)
ssh "$SERVER_HOST" 'cmd /c "cd /d D:\Github\som-sing-phim-printing && git pull && docker compose up -d --build && docker image prune -f && docker compose ps"'

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================================"
    echo "✅ Deploy สำเร็จเรียบร้อยแล้วครับ!"
    echo "📱 หน้าร้าน (Customer): https://somsingphim.tail2bf83b.ts.net:5173"
    echo "   (หรือผ่าน LAN):       http://192.168.100.43:5173"
    echo "🖥️ หลังบ้าน (Admin):     https://somsingphim.tail2bf83b.ts.net:3100"
    echo "   (หรือผ่าน LAN):       http://192.168.100.43:3100"
    echo "⚙️ Backend API:         https://somsingphim.tail2bf83b.ts.net:8080"
    echo "🗄️ pgAdmin:             http://192.168.100.43:5050"
    echo "========================================================"
else
    echo ""
    echo "⚠️ เกิดข้อผิดพลาดในการรันคำสั่งบนเครื่อง Windows"
    echo "💡 หากมีถาม Password ให้ใส่รหัสผ่านล็อกอินของเครื่อง Windows (ASUS)"
fi

echo ""
read -p "กดปุ่ม Enter เพื่อปิดหน้าต่าง..." dummy
