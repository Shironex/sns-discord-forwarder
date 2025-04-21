#!/bin/bash

# Check if URL is provided
if [ -z "$1" ]; then
  echo "Usage: $0 https://yourdomain.pl"
  exit 1
fi

URL="$1"

# List of expected security headers
HEADERS=(
  "Content-Security-Policy"
  "Strict-Transport-Security"
  "X-Content-Type-Options"
  "X-Frame-Options"
  "Referrer-Policy"
  "Permissions-Policy"
  "X-XSS-Protection"
)

# Get HTTP headers
RESPONSE=$(curl -s -I "$URL")

echo "Checking security headers for: $URL"
for HEADER in "${HEADERS[@]}"; do
  if echo "$RESPONSE" | grep -i "$HEADER" > /dev/null; then
    echo "[OK] $HEADER is present."
  else
    echo "[MISSING] $HEADER is missing."
  fi
done
