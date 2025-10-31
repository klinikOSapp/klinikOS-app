#!/bin/bash

# KlinikOS Package Manager Cleanup Script
# This script ensures only PNPM is used and removes all other package manager artifacts

set -e

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

echo "🧹 Starting package manager cleanup for KlinikOS..."

# Remove other package manager lockfiles
echo "📋 Removing conflicting lockfiles..."
find . -name "package-lock.json" -delete 2>/dev/null || true
find . -name "yarn.lock" -delete 2>/dev/null || true  
find . -name "npm-shrinkwrap.json" -delete 2>/dev/null || true
find . -name ".yarnrc*" -delete 2>/dev/null || true

# Clean caches
echo "🗑️  Cleaning package manager caches..."
npm cache clean --force 2>/dev/null || echo "npm cache already clean"
yarn cache clean --all 2>/dev/null || echo "yarn not found"
pnpm store prune 2>/dev/null || echo "pnpm store already clean"

# Remove node_modules and .next
echo "🗂️  Removing node_modules and build artifacts..."
rm -rf node_modules
rm -rf .next
rm -rf dist
rm -rf build

# Verify pnpm configuration
echo "⚙️  Verifying pnpm configuration..."
if [ ! -f ".npmrc" ]; then
    echo "❌ .npmrc not found! Run the setup script first."
    exit 1
fi

if [ ! -f "pnpm-lock.yaml" ]; then
    echo "📦 No pnpm-lock.yaml found, will be created during install..."
fi

# Fresh install
echo "📦 Running fresh pnpm install..."
pnpm install

# Verify installation
echo "✅ Verifying installation..."
if [ ! -d "node_modules" ]; then
    echo "❌ Installation failed - node_modules not found"
    exit 1
fi

if [ ! -f "pnpm-lock.yaml" ]; then
    echo "❌ Installation failed - pnpm-lock.yaml not created"
    exit 1
fi

echo "✅ Package manager cleanup completed successfully!"
echo "🚀 You can now run 'pnpm dev' to start development"