#!/bin/bash
# Script to fix security vulnerabilities in Verista project

echo "=== Fixing security vulnerabilities in Verista project ==="

# Move to project root
cd "$(dirname "$0")"

# Fix frontend vulnerabilities
echo "=== Fixing frontend vulnerabilities ==="
cd frontend

# Update package.json with fixed versions for known vulnerable packages
echo "Updating vulnerable dependencies..."

# Update React and related packages
npm install react@^18.2.0 react-dom@^18.2.0 --save

# Update vite to latest that doesn't break compatibility
npm install vite@^6.2.6 --save-dev

# Update TailwindCSS
npm install tailwindcss@latest postcss@latest autoprefixer@latest --save-dev

# Fix specific vulnerabilities
npm install @supabase/supabase-js@latest --save
npm install react-router-dom@^6.20.0 --save
npm install react-toastify@^9.1.3 --save

# Run audit fix
echo "Running npm audit fix..."
npm audit fix

# Force fix remaining issues
echo "Force fixing remaining security issues..."
npm audit fix --force

# Go to backend
cd ../backend

# Fix backend vulnerabilities
echo "=== Fixing backend vulnerabilities ==="
npm audit fix
npm audit fix --force

# Return to project root
cd ..

# Update package-lock.json
echo "Updating package-lock.json..."
npm i --package-lock-only

echo "=== Security vulnerabilities fixed ==="
echo "Please run 'git add package.json package-lock.json frontend/package.json frontend/package-lock.json backend/package.json backend/package-lock.json'"
echo "Then commit with 'git commit -m \"Fix security vulnerabilities\"'"