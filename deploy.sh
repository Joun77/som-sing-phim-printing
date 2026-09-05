# สร้าง deploy script
cat > ~/deploy-somsing.sh << 'EOF'
#!/bin/bash
MSG=${1:-"update"}
echo "🚀 Deploying: $MSG"
git add .
git commit -m "$MSG"
git push
ssh ASUS@100.116.116.18 "cd D:/Github/som-sing-phim-printing && git pull && docker compose up -d --build"
echo "✅ Done! https://somsingphim.tail2bf83b.ts.net"
EOF

chmod +x ~/deploy-somsing.sh
