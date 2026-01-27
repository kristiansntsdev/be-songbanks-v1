#!/bin/bash
# Script to analyze and reduce Vercel bundle size

echo "📊 Analyzing bundle size..."
echo ""

echo "Top 20 largest dependencies:"
du -sh node_modules/* 2>/dev/null | sort -hr | head -20
echo ""

echo "📦 Total node_modules size:"
du -sh node_modules 2>/dev/null
echo ""

echo "🔍 Checking for unused dependencies..."
echo ""

echo "Checking if @faker-js/faker is used in production code:"
grep -r "@faker-js/faker" app/ routes/ config/ api/ --include="*.js" 2>/dev/null | wc -l

echo "Checking if sqlite3 is used in production code:"
grep -r "sqlite3" app/ routes/ config/ api/ --include="*.js" 2>/dev/null | wc -l

echo ""
echo "💡 Recommendations:"
echo "1. Move development-only packages to devDependencies"
echo "2. Use .vercelignore to exclude unnecessary files"
echo "3. Consider external database (you're using MariaDB already)"
echo "4. Exclude test files and documentation from deployment"
