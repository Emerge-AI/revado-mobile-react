#!/bin/bash

# Start Backend Server Script
echo "🚀 Starting Revado Backend Server..."

# Kill any existing server
pkill -f "node.*server.js" 2>/dev/null

# Wait a moment
sleep 1

# Start the server
cd "$(dirname "$0")"
node server.js &

# Wait for server to start
sleep 2

# Test if server is running
if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend server is running!"
    echo ""
    echo "📍 Access points:"
    echo "   API:        http://localhost:3001"
    echo "   Test Page:  http://localhost:3001/test.html"
    echo "   Health:     http://localhost:3001/api/health"
    echo ""
    echo "🧪 To test the complete flow:"
    echo "   1. Open http://localhost:3001/test.html in your browser"
    echo "   2. Or start the React app with: npm run dev"
else
    echo "❌ Server failed to start"
    echo "Check logs with: tail -f server.log"
fi