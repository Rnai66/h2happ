#!/usr/bin/env bash
set -euo pipefail

# === Config ===
BASE="${BASE:-https://h2h-thailand-v0-1-62.onrender.com}"  # เปลี่ยนเป็น http://localhost:4000 ได้
BUYER_ID="${BUYER_ID:-6748aaaa0000000000000001}"
SELLER_ID="${SELLER_ID:-6748aaaa0000000000000002}"
ITEM_ID="${ITEM_ID:-6748bbbb0000000000000001}"
PRICE="${PRICE:-12000}"
SLIP_PATH="${SLIP_PATH:-$HOME/Downloads/slip.jpg}"

req() { curl -fsS "$@"; }  # fail fast
jqr() { jq -r "$@" || true; }

echo "== Base: $BASE"
echo "== Slip: $SLIP_PATH"
test -f "$SLIP_PATH" || { echo "❌ ไม่พบไฟล์สลิป: $SLIP_PATH"; exit 1; }

echo "🔐 Login buyer..."
BUYER_TOKEN=$(req -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" \
  -d "{\"userId\":\"$BUYER_ID\",\"name\":\"buyerA\"}" | jqr '.token')
echo "🔐 Login seller..."
SELLER_TOKEN=$(req -X POST "$BASE/api/auth/login" -H "Content-Type: application/json" \
  -d "{\"userId\":\"$SELLER_ID\",\"name\":\"sellerB\"}" | jqr '.token')

echo "📦 Create order..."
ORDER_ID=$(req -X POST "$BASE/api/orders" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"itemId\":\"$ITEM_ID\",\"sellerId\":\"$SELLER_ID\",\"price\":$PRICE,\"method\":\"bank_transfer\"}" \
  | jqr '._id')
echo "ORDER_ID=$ORDER_ID"

echo "🧾 Upload slip..."
req -X POST "$BASE/api/orders/$ORDER_ID/slip" \
  -H "Authorization: Bearer $BUYER_TOKEN" \
  -F "slip=@$SLIP_PATH" | jq .

echo "✅ Seller verify..."
req -X POST "$BASE/api/orders/$ORDER_ID/verify-payment" \
  -H "Authorization: Bearer $SELLER_TOKEN" | jq .

echo "🎉 Buyer complete..."
req -X POST "$BASE/api/orders/$ORDER_ID/complete" \
  -H "Authorization: Bearer $BUYER_TOKEN" | jq .

echo "🔎 Final order:"
req "$BASE/api/orders/$ORDER_ID" | jq .
