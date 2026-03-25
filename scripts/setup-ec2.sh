#!/bin/bash
set -e

echo "=== Scorely EC2 Setup ==="

# Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm
npm install -g pnpm

# PM2
npm install -g pm2
pm2 startup

# Nginx
sudo apt-get install -y nginx

# 앱 디렉토리
mkdir -p /home/ubuntu/scorely/apps/backend/logs

# Nginx 설정 복사
sudo cp /home/ubuntu/scorely/apps/backend/nginx.conf /etc/nginx/sites-available/scorely
sudo ln -sf /etc/nginx/sites-available/scorely /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

echo "=== Setup complete ==="
