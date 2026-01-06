#!/bin/bash

# Configuration
API_URL="http://localhost:8000"
ADMIN_EMAIL="admin@digifortlabs.com"
ADMIN_PASS="admin123"

echo "---------------------------------------------------"
echo "🛠️  Verifying Patient Load Fix (Curl Version)"
echo "---------------------------------------------------"

# 1. Login to get Token
echo "🔑 Logging in..."
# Endpoint is /auth/token (OAuth2 standard)
TOKEN_RESPONSE=$(curl -s -X POST "$API_URL/auth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=$ADMIN_EMAIL&password=$ADMIN_PASS")

# Extract Token (Simple parsing)
TOKEN=$(echo $TOKEN_RESPONSE | grep -o '"access_token":"[^"]*' | grep -o '[^"]*$')

if [ -z "$TOKEN" ]; then
  echo "❌ Login Failed."
  echo "Response: $TOKEN_RESPONSE"
  exit 1
fi

echo "✅ Login Successful!"

# 2. Test the Patient Endpoint
echo "🏥 Testing Patient ID 1 Load..."
RESPONSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/patients/1" \
  -H "Authorization: Bearer $TOKEN")

if [ "$RESPONSE_CODE" == "200" ]; then
  echo "✅ SUCCESS! Status Code: 200"
  echo "The 'Error Loading Patient' bug is FIXED."
elif [ "$RESPONSE_CODE" == "500" ]; then
  echo "❌ FAILED (Still Broken). Status Code: 500"
  echo "Please Ensure you ran 'docker compose up -d --build backend'"
elif [ "$RESPONSE_CODE" == "404" ]; then
  echo "⚠️ Patient Not Found (404)"
  echo "The API is working (no crash), but Patient #1 doesn't exist in the DB."
else
  echo "❌ Unexpected Status: $RESPONSE_CODE"
fi
echo "---------------------------------------------------"
