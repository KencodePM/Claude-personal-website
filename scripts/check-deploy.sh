#!/usr/bin/env bash
# check-deploy.sh — 一鍵確認 Vercel + Render + Render Status 部署狀態
# Usage: bash scripts/check-deploy.sh

set -euo pipefail

BACKEND_URL="https://portfolio-backend-2qry.onrender.com"
VERCEL_URL="https://claude-personal-website-hazel.vercel.app"

echo "=========================================="
echo "  Portfolio Deploy Status Check"
echo "=========================================="
echo ""

# --- Render Status Page ---
echo "🌐 Render Platform Status"
status_json=$(curl -s --max-time 10 "https://status.render.com/api/v2/status.json" 2>/dev/null || echo "")
if [ -n "$status_json" ]; then
  description=$(echo "$status_json" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['status']['description'])" 2>/dev/null || echo "unknown")
  indicator=$(echo "$status_json" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['status']['indicator'])" 2>/dev/null || echo "unknown")
  if [ "$indicator" = "none" ]; then
    echo "  ✅ All Systems Operational"
  else
    echo "  ⚠️  $description (indicator: $indicator)"
    echo "  → Check: https://status.render.com"
  fi
else
  echo "  ❌ Could not fetch Render status"
fi

echo ""

# --- Backend Health ---
echo "🔧 Backend Health (Render)"
echo "  URL: $BACKEND_URL/api/health"
start=$(date +%s%3N 2>/dev/null || date +%s)
backend_response=$(curl -s --max-time 35 "$BACKEND_URL/api/health" 2>/dev/null || echo "")
end=$(date +%s%3N 2>/dev/null || date +%s)

if echo "$backend_response" | grep -q '"ok"'; then
  echo "  ✅ Healthy — response: $backend_response"
elif [ -n "$backend_response" ]; then
  echo "  ⚠️  Got response but unexpected: $backend_response"
else
  echo "  ❌ No response (521 or timeout — service may be spinning up)"
  echo "  → Manual check: $BACKEND_URL/api/health"
fi

echo ""

# --- Frontend ---
echo "🖥️  Frontend (Vercel)"
echo "  URL: $VERCEL_URL"
frontend_status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 15 "$VERCEL_URL" 2>/dev/null || echo "error")
if [ "$frontend_status" = "200" ]; then
  echo "  ✅ HTTP $frontend_status — Frontend is up"
else
  echo "  ⚠️  HTTP $frontend_status — Check Vercel Dashboard"
  echo "  → https://vercel.com/kencodepms-projects/claude-personal-website"
fi

echo ""

# --- Git Status ---
echo "📦 Local Git Status"
repo_root="$(git -C "$(dirname "$0")/.." rev-parse --show-toplevel 2>/dev/null || echo "")"
if [ -n "$repo_root" ]; then
  local_sha=$(git -C "$repo_root" rev-parse --short HEAD 2>/dev/null || echo "unknown")
  remote_sha=$(git -C "$repo_root" rev-parse --short origin/main 2>/dev/null || echo "unknown")
  echo "  Local HEAD:   $local_sha"
  echo "  origin/main:  $remote_sha"
  if [ "$local_sha" = "$remote_sha" ]; then
    echo "  ✅ In sync with remote"
  else
    echo "  ⚠️  Local differs from remote — consider pushing"
  fi
else
  echo "  ⚠️  Not in a git repo"
fi

echo ""
echo "=========================================="
