#!/bin/bash

# Garden Observatory Launcher
# Starts all components for real-time garden visualization

echo "🌍 Starting Garden Observatory..."

# Kill any existing processes
echo "Cleaning up old processes..."
pkill -f "data-bridge.ts" || true
pkill -f "timeline-chronicler.ts" || true
pkill -f "api-handler.ts" || true
pkill -f "observatory-server" || true

# Start Data Bridge
echo "🌉 Starting Data Bridge..."
cd /Users/chaoshex/fractal-hub/garden/observatory
deno run --allow-read --allow-write --allow-net --allow-env data-bridge.ts &
BRIDGE_PID=$!

# Start Timeline Chronicler
echo "⏰ Starting Timeline Chronicler..."
cd /Users/chaoshex/fractal-hub/garden/observatory/timeline
deno run --allow-read --allow-write --allow-env timeline-chronicler.ts &
CHRONICLER_PID=$!

# Start Predictive Engine API
echo "🔮 Starting Predictive Engine API..."
cd /Users/chaoshex/fractal-hub/garden/observatory/predictive-engine
deno run --allow-read --allow-write --allow-env --allow-net api-handler.ts &
API_PID=$!

# Start HTTP server for Observatory UI
echo "🌐 Starting Observatory UI..."
cd /Users/chaoshex/fractal-hub/garden/observatory
python3 -m http.server 8090 --bind localhost &
UI_PID=$!

echo ""
echo "✨ Garden Observatory is running!"
echo ""
echo "📊 Observatory UI: http://localhost:8090"
echo "🌉 Data Bridge WebSocket: ws://localhost:8088"
echo "🔮 Predictive API: http://localhost:8089"
echo ""
echo "Process PIDs:"
echo "  Data Bridge: $BRIDGE_PID"
echo "  Chronicler: $CHRONICLER_PID"
echo "  Predictive API: $API_PID"
echo "  UI Server: $UI_PID"
echo ""
echo "Press Ctrl+C to stop all services"

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down Observatory..."
    kill $BRIDGE_PID $CHRONICLER_PID $API_PID $UI_PID 2>/dev/null
    echo "Observatory stopped."
    exit 0
}

# Set up trap for cleanup
trap cleanup INT TERM

# Wait for processes
wait