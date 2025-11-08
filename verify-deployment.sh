#!/bin/bash
# WebOS Deployment Verification Script

echo "╔══════════════════════════════════════════════════════════╗"
echo "║         WebOS Deployment Verification                   ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check if URL is provided
if [ -z "$1" ]; then
    echo "Usage: ./verify-deployment.sh <your-vercel-url>"
    echo "Example: ./verify-deployment.sh https://webos-abc123.vercel.app"
    echo ""
    exit 1
fi

URL=$1
echo "🔍 Testing deployment at: $URL"
echo ""

# Test 1: Health Check
echo "Test 1: API Health Check"
HEALTH=$(curl -s "$URL/api/health" | grep -o '"status":"ok"')
if [ ! -z "$HEALTH" ]; then
    echo "✅ API is healthy"
else
    echo "❌ API health check failed"
fi
echo ""

# Test 2: System Status
echo "Test 2: System Status API"
SYSTEM=$(curl -s "$URL/api/system/status" | grep -o '"cpu"')
if [ ! -z "$SYSTEM" ]; then
    echo "✅ System status API working"
else
    echo "❌ System status API failed"
fi
echo ""

# Test 3: Main Page
echo "Test 3: Main Page"
PAGE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
if [ "$PAGE" = "200" ]; then
    echo "✅ Main page loads (HTTP 200)"
else
    echo "❌ Main page failed (HTTP $PAGE)"
fi
echo ""

# Test 4: Assets
echo "Test 4: Static Assets"
ASSETS=$(curl -s -o /dev/null -w "%{http_code}" "$URL/assets/")
if [ "$ASSETS" = "200" ] || [ "$ASSETS" = "301" ] || [ "$ASSETS" = "302" ]; then
    echo "✅ Assets are accessible"
else
    echo "⚠️  Assets check returned HTTP $ASSETS"
fi
echo ""

# Summary
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                    Test Summary                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "Your WebOS deployment URL: $URL"
echo ""
echo "Next steps:"
echo "1. Visit $URL in your browser"
echo "2. Test all applications (NotePad, Paint, Calculator, Shell, Clock)"
echo "3. Check browser console for errors (F12)"
echo "4. Update README.md with this URL"
echo "5. Start promoting on Hacker News and Reddit!"
echo ""
