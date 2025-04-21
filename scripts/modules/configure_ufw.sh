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

# Set default policies
ufw default deny incoming
ufw default allow outgoing
log "Set default policies: deny incoming, allow outgoing."

# Allow SSH traffic
ufw allow OpenSSH
log "Allowed SSH traffic."

# Allow HTTP and HTTPS traffic
ufw allow http
ufw allow https
log "Allowed HTTP and HTTPS traffic."

# Enable UFW with force
ufw --force enable
log "Enabled UFW."
