#!/bin/bash

# Development Server Script for Track Application
# Runs backend on port 8001 and frontend on port 3001

set -e

echo "🚀 Starting Track Development Servers..."
echo "Backend: http://localhost:8001"
echo "Frontend: http://localhost:3001"
echo "Press Ctrl+C to stop all servers"

# Function to cleanup background processes on exit
cleanup() {
    echo ""
    echo "🛑 Stopping development servers..."
    jobs -p | xargs -r kill
    echo "✅ All servers stopped"
    exit 0
}

# Set trap to cleanup on script exit
trap cleanup SIGINT SIGTERM EXIT

# Start Django backend on port 8001
echo "📡 Starting Django backend on port 8001..."
cd backend
python3 manage.py runserver 8001 &
BACKEND_PID=$!

# Wait a moment for backend to start
sleep 2

# Start React frontend on port 3001
echo "⚛️  Starting React frontend on port 3001..."
cd ../frontend
PORT=3001 npm start &
FRONTEND_PID=$!

echo ""
echo "✅ Development servers started successfully!"
echo "🔗 Backend API: http://localhost:8001"
echo "🌐 Frontend App: http://localhost:3001"
echo ""
echo "📝 Note: Both servers will restart automatically on file changes"
echo "💡 Use Ctrl+C to stop all servers"

# Wait for background processes
wait