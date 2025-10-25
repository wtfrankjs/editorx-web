#!/bin/bash

# EditorX Web Deployment Script
echo "🚀 Starting EditorX Web deployment..."

# Update system
sudo apt update

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
fi

# Install PM2 if not installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    sudo npm install -g pm2
fi

# Navigate to project directory
cd /var/www/editorx-web

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the project
echo "🔨 Building project..."
npm run build

# Install serve globally for static file serving
if ! command -v serve &> /dev/null; then
    echo "📦 Installing serve..."
    sudo npm install -g serve
fi

# Start with PM2
echo "🚀 Starting application with PM2..."
pm2 stop editorx-web 2>/dev/null || true
pm2 start "serve -s dist -l 3001" --name "editorx-web"
pm2 save
pm2 startup

echo "✅ EditorX Web deployment completed!"
echo "🌐 Application should be running on port 3001"
