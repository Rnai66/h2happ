#!/usr/bin/env bash
set -e

echo "🚀 H2H Surin v0.1.67 — Run_All.sh"
echo "================================="

# --- helpers ---
fail () {
  echo "❌ $1"
  exit 1
}

# --- check node ---
if ! command -v node >/dev/null 2>&1; then
  fail "Node.js not found. Please install Node.js (>=18)"
fi

NODE_VERSION=$(node -v)
echo "✅ Node.js $NODE_VERSION"

# --- backend ---
echo ""
echo "📦 Backend setup"
cd backend || fail "backend folder not found"

if [ ! -f ".env" ]; then
  echo "⚠️  backend/.env not found"
  echo "👉 Copy from backend/.env.example and fill real values"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "📥 Installing backend dependencies..."
  npm install
else
  echo "✅ Backend dependencies already installed"
fi

# optional db test
if npm run | grep -q "test:db"; then
  echo "�� Testing database connections..."
  npm run test:db || fail "DB test failed"
fi

# --- frontend ---
echo ""
echo "🎨 Frontend setup"
cd ../frontend || fail "frontend folder not found"

if [ ! -d "node_modules" ]; then
  echo "📥 Installing frontend dependencies..."
  npm install
else
  echo "✅ Frontend dependencies already installed"
fi

# --- run both ---
echo ""
echo "🔥 Starting Backend + Frontend"

cd ..

# prefer concurrently if exists
if npm list concurrently >/dev/null 2>&1; then
  npx concurrently \
    -n "BACKEND,FRONTEND" \
    -c "blue,green" \
    "npm run dev --prefix backend" \
    "npm run dev --prefix frontend"
else
  echo "ℹ️ concurrently not found, installing..."
  npm install -D concurrently
  npx concurrently \
    -n "BACKEND,FRONTEND" \
    -c "blue,green" \
    "npm run dev --prefix backend" \
    "npm run dev --prefix frontend"
fi


