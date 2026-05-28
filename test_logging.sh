#!/bin/bash
# Run this while the backend is running in another terminal.
# Watch the backend terminal to see Morgan log lines for each request.

BASE="http://localhost:3001"

echo "=== CIA API Logging Test ==="

# login
echo ""
echo "[1] Login"
LOGIN=$(curl -s -X POST "$BASE/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin"}')
echo "$LOGIN"

TOKEN=$(echo "$LOGIN" | python3 -c "import sys,json; print(json.load(sys.stdin).get('token',''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "No token received. Is the backend running?"
  exit 1
fi

echo "Token: ${TOKEN:0:40}..."

# list products
echo ""
echo "[2] GET /product/"
curl -s "$BASE/product/" -H "auth: $TOKEN" | python3 -m json.tool

# create a product
echo ""
echo "[3] POST /product/"
CREATE=$(curl -s -X POST "$BASE/product/" \
  -H "Content-Type: application/json" \
  -H "auth: $TOKEN" \
  -d '{"name":"TestItem","category":"Fruit","description":"test","amount":10,"price":5,"hasExpiryDate":false}')
echo "$CREATE"
ID=$(echo "$CREATE" | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
echo "Created ID: $ID"

# get that product
echo ""
echo "[4] GET /product/$ID"
curl -s "$BASE/product/$ID" -H "auth: $TOKEN" | python3 -m json.tool

# edit it
echo ""
echo "[5] PATCH /product/$ID"
curl -s -X PATCH "$BASE/product/$ID" \
  -H "Content-Type: application/json" \
  -H "auth: $TOKEN" \
  -d '{"name":"TestItem","category":"Fruit","description":"updated","amount":20,"price":9,"hasExpiryDate":true}' | python3 -m json.tool

# try with no token - should get 401
echo ""
echo "[6] GET /product/ with no token (expect 401)"
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE/product/"

# delete the test product
echo ""
echo "[7] DELETE /product/$ID"
curl -s -o /dev/null -w "Status: %{http_code}\n" -X DELETE "$BASE/product/$ID" -H "auth: $TOKEN"

# confirm gone
echo ""
echo "[8] GET /product/$ID (expect 404)"
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BASE/product/$ID" -H "auth: $TOKEN"

echo ""
echo "=== Done. Check your backend terminal for the Morgan log lines. ==="
