#!/bin/bash

# Colors for better readability
GREEN="\e[32m"
RED="\e[31m"
RESET="\e[0m"

log() {
    echo -e "${GREEN}[INFO]${RESET} $1"
}

error() {
    echo -e "${RED}[ERROR]${RESET} $1"
}

# Set your Discord Webhook URL
WEBHOOK_URL="https://discord.com/api/webhooks/..."  # Replace with your webhook

# Find failed login attempts from the last 24 hours
FAILED_LOGINS=$(grep "Failed password" /var/log/auth.log | grep "$(date '+%b %d')" | tail -n 20)

# If failed attempts are found, send them to Discord
if [ -n "$FAILED_LOGINS" ]; then
    # Escape quotes and new lines
    ESCAPED_LOGS=$(printf "%s\n" "$FAILED_LOGINS" | sed ':a;N;$!ba;s/"/\\"/g; s/\n/\\n/g')
    PAYLOAD="{\"embeds\":[{\"title\":\"Failed Login Attempts\",\"description\":\"\`\`\`$ESCAPED_LOGS\`\`\`\",\"color\":15158332}]}"
else
    PAYLOAD="{\"embeds\":[{\"title\":\"No failed login attempts\",\"description\":\"No new failed login attempts in the last 24 hours.\",\"color\":3066993}]}"
fi

curl -H "Content-Type: application/json" \
-X POST \
-d "$PAYLOAD" \
"$WEBHOOK_URL"
