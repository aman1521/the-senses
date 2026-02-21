#!/bin/bash

# 🚀 Quick Setup Script - The Senses Test Flow

echo "=========================================="
echo "🧠 The Senses - Quick Setup"
echo "=========================================="
echo ""

# Check Node.js
echo "✓ Checking Node.js..."
node --version || { echo "❌ Node.js not found. Please install Node.js."; exit 1; }

# Check MongoDB
echo "✓ Checking MongoDB..."
mongosh --version || { echo "⚠️  MongoDB not found. Ensure MongoDB is running."; }

echo ""
echo "=========================================="
echo "📦 Installing Dependencies"
echo "=========================================="
echo ""

# Backend dependencies
echo "📚 Installing Backend dependencies..."
cd Backend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Backend installation failed"
    exit 1
fi
echo "✅ Backend dependencies installed"

# Frontend dependencies
echo "📚 Installing Frontend dependencies..."
cd ../frontend
npm install
if [ $? -ne 0 ]; then
    echo "❌ Frontend installation failed"
    exit 1
fi
echo "✅ Frontend dependencies installed"

echo ""
echo "=========================================="
echo "🌱 Seeding Database"
echo "=========================================="
echo ""

cd ../Backend
node seed/seedQuestions.js
if [ $? -ne 0 ]; then
    echo "⚠️  Question seeding had issues"
fi

echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "📝 Next Steps:"
echo ""
echo "Terminal 1 - Start Backend:"
echo "  cd Backend"
echo "  npm start"
echo "  (Will run on http://localhost:5000)"
echo ""
echo "Terminal 2 - Start Frontend:"
echo "  cd frontend"
echo "  npm run dev"
echo "  (Will run on http://localhost:5173)"
echo ""
echo "🌐 Then visit: http://localhost:5173"
echo ""
echo "=========================================="
