#!/bin/bash

# Garden Observatory Deployment Script
# Deploy to g1f9e0.com

set -e

OBSERVATORY_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DEPLOY_HOST="g1f9e0.com"
DEPLOY_PATH="/var/www/observatory"
DEPLOY_USER="garden"

echo "🚀 Deploying Garden Observatory to ${DEPLOY_HOST}"
echo "==========================================="

# Check if running locally
if [[ "$1" == "--local" ]]; then
    echo "📍 Local deployment mode"
    
    # Start data bridge
    echo "🌉 Starting Data Bridge..."
    deno run --allow-read --allow-write --allow-net --allow-env \
        "${OBSERVATORY_DIR}/data-bridge.ts" &
    BRIDGE_PID=$!
    
    echo "⏳ Waiting for bridge to start..."
    sleep 3
    
    # Open in browser
    echo "🌐 Opening Observatory in browser..."
    if command -v open &> /dev/null; then
        open "file://${OBSERVATORY_DIR}/index.html"
    elif command -v xdg-open &> /dev/null; then
        xdg-open "file://${OBSERVATORY_DIR}/index.html"
    else
        echo "📋 Open in browser: file://${OBSERVATORY_DIR}/index.html"
    fi
    
    echo ""
    echo "✅ Local Observatory running!"
    echo "   Data Bridge PID: ${BRIDGE_PID}"
    echo "   Press Ctrl+C to stop"
    
    # Wait for interrupt
    trap "kill ${BRIDGE_PID}; exit" INT
    wait
    
else
    # Remote deployment
    echo "🔐 Checking SSH access..."
    if ! ssh -q "${DEPLOY_USER}@${DEPLOY_HOST}" exit; then
        echo "❌ Cannot connect to ${DEPLOY_HOST}"
        echo "   Please ensure SSH access is configured"
        exit 1
    fi
    
    # Build production version
    echo "🔨 Building production version..."
    
    # Minify JavaScript (if terser is available)
    if command -v terser &> /dev/null; then
        terser "${OBSERVATORY_DIR}/observatory.js" \
               -o "${OBSERVATORY_DIR}/observatory.min.js" \
               --compress --mangle
        
        terser "${OBSERVATORY_DIR}/observatory-live.js" \
               -o "${OBSERVATORY_DIR}/observatory-live.min.js" \
               --compress --mangle
    else
        echo "⚠️  Terser not found, using unminified JS"
        cp "${OBSERVATORY_DIR}/observatory.js" "${OBSERVATORY_DIR}/observatory.min.js"
        cp "${OBSERVATORY_DIR}/observatory-live.js" "${OBSERVATORY_DIR}/observatory-live.min.js"
    fi
    
    # Update index.html to use minified versions
    sed -i.bak 's/observatory.js/observatory.min.js/g' "${OBSERVATORY_DIR}/index.html"
    
    # Create deployment package
    echo "📦 Creating deployment package..."
    tar -czf /tmp/observatory-deploy.tar.gz \
        -C "${OBSERVATORY_DIR}" \
        index.html \
        observatory.min.js \
        observatory-live.min.js \
        README.md
    
    # Deploy to server
    echo "📤 Uploading to server..."
    scp /tmp/observatory-deploy.tar.gz "${DEPLOY_USER}@${DEPLOY_HOST}:/tmp/"
    
    # Install on server
    echo "🔧 Installing on server..."
    ssh "${DEPLOY_USER}@${DEPLOY_HOST}" << 'EOF'
        set -e
        
        # Create directory
        sudo mkdir -p /var/www/observatory
        sudo chown garden:garden /var/www/observatory
        
        # Extract files
        cd /var/www/observatory
        tar -xzf /tmp/observatory-deploy.tar.gz
        rm /tmp/observatory-deploy.tar.gz
        
        # Set up systemd service for data bridge
        sudo tee /etc/systemd/system/garden-data-bridge.service > /dev/null << 'SERVICE'
[Unit]
Description=Garden Observatory Data Bridge
After=network.target

[Service]
Type=simple
User=garden
WorkingDirectory=/home/garden/garden
ExecStart=/home/garden/.deno/bin/deno run --allow-read --allow-write --allow-net --allow-env /home/garden/garden/observatory/data-bridge.ts
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICE
        
        # Start service
        sudo systemctl daemon-reload
        sudo systemctl enable garden-data-bridge
        sudo systemctl restart garden-data-bridge
        
        # Update nginx config
        sudo tee /etc/nginx/sites-available/observatory > /dev/null << 'NGINX'
server {
    listen 443 ssl http2;
    server_name observatory.g1f9e0.com;
    
    ssl_certificate /etc/letsencrypt/live/g1f9e0.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/g1f9e0.com/privkey.pem;
    
    root /var/www/observatory;
    index index.html;
    
    location / {
        try_files $uri $uri/ =404;
    }
    
    location /ws {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
NGINX
        
        # Enable site
        sudo ln -sf /etc/nginx/sites-available/observatory /etc/nginx/sites-enabled/
        sudo nginx -t && sudo systemctl reload nginx
        
        echo "✅ Deployment complete!"
EOF
    
    # Restore original index.html
    mv "${OBSERVATORY_DIR}/index.html.bak" "${OBSERVATORY_DIR}/index.html"
    
    # Clean up
    rm -f /tmp/observatory-deploy.tar.gz
    rm -f "${OBSERVATORY_DIR}"/*.min.js
    
    echo ""
    echo "🎉 Garden Observatory deployed successfully!"
    echo "   URL: https://observatory.g1f9e0.com"
    echo "   WebSocket: wss://observatory.g1f9e0.com/ws"
fi