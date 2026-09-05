#!/usr/bin/env bash
set -e

MSG=${1:-"auto-deploy $(date '+%Y-%m-%d %H:%M:%S')"}
REMOTE_PATH="D:/Github/som-sing-phim-printing"

echo "=========================================="
echo "🚀 Som Sing Phim: Deploying to Windows Server"
echo "💬 Message: $MSG"
echo "=========================================="

# Auto-detect IP: LAN 192.168.100.43 vs Tailscale 100.116.116.18
SERVER_IP=""
if nc -z -G 1 192.168.100.43 22 2>/dev/null; then
    SERVER_IP="192.168.100.43"
    echo "⚡ เชื่อมต่อผ่าน Local Wi-Fi (192.168.100.43)"
elif nc -z -G 2 100.116.116.18 22 2>/dev/null; then
    SERVER_IP="100.116.116.18"
    echo "🌐 เชื่อมต่อผ่าน Tailscale (100.116.116.18)"
else
    echo "❌ ไม่สามารถติดต่อเครื่อง Windows ได้ทั้งผ่าน LAN และ Tailscale"
    echo "💡 ตรวจสอบว่าเปิดแอป Tailscale บน Mac หรือเชื่อมต่อ Wi-Fi เดียวกันหรือไม่"
    exit 1
fi

SERVER_HOST="ASUS@$SERVER_IP"
echo "🌐 Server:  $SERVER_HOST"
echo "📂 Remote:  $REMOTE_PATH"
echo "------------------------------------------"

# 1. Check & Commit local changes (if any)
git add -A
if git diff-index --quiet HEAD --; then
    echo "ℹ️  No local changes to commit. Proceeding with push/sync..."
else
    git commit -m "$MSG"
fi

# 2. Push to Git remote
echo "⬆️  Pushing changes to Git repository..."
git push

# 3. SSH into Windows Server & Update Docker Containers
echo "🔄 Updating & Rebuilding containers on Windows Server..."
ssh "$SERVER_HOST" "cmd /c \"cd /d $REMOTE_PATH && git pull && docker compose up -d --build && docker image prune -f && docker compose ps\""

echo ""
echo "=========================================="
echo "✅ Deployment Completed Successfully!"
echo "📱 Customer Service: https://somsingphim.tail2bf83b.ts.net:5173"
echo "   (หรือผ่าน LAN):    http://$SERVER_IP:5173"
echo "🖥️ Admin ERP:        https://somsingphim.tail2bf83b.ts.net:3100"
echo "   (หรือผ่าน LAN):    http://$SERVER_IP:3100"
echo "⚙️ Backend API:      https://somsingphim.tail2bf83b.ts.net:8080"
echo "🗄️ pgAdmin:          http://$SERVER_IP:5050"
echo "=========================================="
