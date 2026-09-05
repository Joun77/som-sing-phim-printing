#!/usr/bin/env bash
set -e

MSG=${1:-"auto-deploy $(date '+%Y-%m-%d %H:%M:%S')"}
SERVER_HOST="ASUS@100.116.116.18"
REMOTE_PATH="D:/Github/som-sing-phim-printing"

echo "=========================================="
echo "🚀 Som Sing Phim: Deploying to Windows Server"
echo "💬 Message: $MSG"
echo "🌐 Server:  $SERVER_HOST"
echo "📂 Remote:  $REMOTE_PATH"
echo "=========================================="

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
echo "🖥️ Admin ERP:        https://somsingphim.tail2bf83b.ts.net:3100"
echo "⚙️ Backend API:      https://somsingphim.tail2bf83b.ts.net:8080"
echo "🗄️ pgAdmin:          http://100.116.116.18:5050"
echo "=========================================="
