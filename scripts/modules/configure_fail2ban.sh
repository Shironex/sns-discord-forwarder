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

# Install Fail2Ban
apt install -y fail2ban
log "Installed Fail2Ban."

# Configure Fail2Ban for SSH
cat <<EOL > /etc/fail2ban/jail.local
[sshd]
enabled = true
port    = ssh
logpath = /var/log/auth.log
maxretry = 5
bantime = 3600
EOL
log "Configured Fail2Ban for SSH."

# Restart Fail2Ban service
systemctl restart fail2ban
log "Restarted Fail2Ban service."
