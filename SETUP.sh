#!/bin/bash

# =============================================================================
# LOVOL DMS - Quick Setup Script
# =============================================================================
# Run this script to verify and start your development environment
# Usage: bash SETUP.sh
# =============================================================================

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                    LOVOL DMS - Quick Setup                       ║"
echo "║          Distribution Management System Setup Script             ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Check Node.js
echo "🔍 Checking Node.js version..."
if command -v node &> /dev/null
then
    NODE_VERSION=$(node --version)
    echo "✅ Node.js is installed: $NODE_VERSION"
else
    echo "❌ Node.js is not installed. Please install Node.js v18+ from https://nodejs.org"
    exit 1
fi

echo ""

# Check pnpm
echo "🔍 Checking pnpm..."
if command -v pnpm &> /dev/null
then
    PNPM_VERSION=$(pnpm --version)
    echo "✅ pnpm is installed: v$PNPM_VERSION"
else
    echo "⚠️  pnpm is not installed. Installing pnpm globally..."
    npm install -g pnpm
    echo "✅ pnpm installed successfully!"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo "⏱️  This may take 1-2 minutes..."
echo ""

pnpm install

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Dependencies installed successfully!"
else
    echo ""
    echo "❌ Failed to install dependencies. Please check the error messages above."
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Display next steps
echo "✨ Setup Complete! ✨"
echo ""
echo "🚀 To start the development server, run:"
echo ""
echo "   pnpm run dev"
echo ""
echo "📖 Then open your browser and navigate to:"
echo "   http://localhost:5173"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📚 Documentation:"
echo "   • Quick Start:        QUICKSTART.md"
echo "   • Full Documentation: README.md"
echo "   • Setup Checklist:    SETUP-CHECKLIST.md"
echo "   • System Overview:    SYSTEM-OVERVIEW.md"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎯 What's Included:"
echo "   ✓ 8 Core Modules (Dashboard, Leads, Dealers, Products, Orders, etc.)"
echo "   ✓ 14 Page Components"
echo "   ✓ 50+ UI Components"
echo "   ✓ Complete Mock Data"
echo "   ✓ Responsive Design"
echo "   ✓ Enterprise-Grade UI"
echo ""
echo "Happy Coding! 🎉"
echo ""
