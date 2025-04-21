#!/bin/bash

set -e

GREEN="\e[32m"
BLUE="\e[34m"
RED="\e[31m"
RESET="\e[0m"

log() {
  echo -e "${BLUE}[INFO]${RESET} $1"
}

success() {
  echo -e "${GREEN}[OK]${RESET} $1"
}

error() {
  echo -e "${RED}[ERROR]${RESET} $1"
}

# Check root
if [ "$EUID" -ne 0 ]; then
  error "This script must be run as root."
  exit 1
fi

# Configuration
EMAIL="email"
WEBHOOK_URL="production_website_url"
CONFIG_FILE="/etc/rkhunter.conf"
BACKUP_FILE="${CONFIG_FILE}.bak.$(date +%Y%m%d%H%M%S)"
LOG_FILE="/var/log/rkhunter.log"

# Install rkhunter if needed
if ! command -v rkhunter &>/dev/null; then
  log "Installing rkhunter..."
  apt update && apt install -y rkhunter mailutils curl
  success "rkhunter installed."
else
  success "rkhunter already installed."
fi

# Backup original config
if [ -f "$CONFIG_FILE" ]; then
  log "Creating backup of original configuration at $BACKUP_FILE"
  cp "$CONFIG_FILE" "$BACKUP_FILE"
  success "Configuration backup created."
fi

# Patch config
log "Patching $CONFIG_FILE with required settings..."

# Fix WEB_CMD if needed
if grep -qs '^WEB_CMD=' "$CONFIG_FILE"; then
  sed -i 's/^WEB_CMD=.*/#&/' "$CONFIG_FILE"
  log "Disabled WEB_CMD restriction for updates."
fi

# Enable updates & mirror config
sed -i 's/^UPDATE_MIRRORS=.*/UPDATE_MIRRORS=1/' "$CONFIG_FILE" || echo "UPDATE_MIRRORS=1" >> "$CONFIG_FILE"
sed -i 's/^MIRRORS_MODE=.*/MIRRORS_MODE=0/' "$CONFIG_FILE" || echo "MIRRORS_MODE=0" >> "$CONFIG_FILE"

# Remove default mail setting
sed -i '/^MAIL-ON-WARNING=.*/d' "$CONFIG_FILE"

# Add common false positive allowlists
log "Adding common allowlists for false positives..."
cat >> "$CONFIG_FILE" <<EOF

# Added by configure_rkhunter.sh - Common allowlists
ALLOWDEVS=/dev/cdrom
ALLOWDEVS=/dev/dvd
ALLOWDEVS=/dev/sr0
ALLOWDEVS=/dev/tty1
ALLOWDEVS=/dev/ttyS0
ALLOWDEVS=/dev/null
ALLOWDEVS=/dev/zero
ALLOWHIDDENDIR=/dev/.udev
ALLOWHIDDENDIR=/dev/.mdadm
ALLOWHIDDENFILE=/etc/.updated
ALLOWHIDDENFILE=/etc/.pwd.lock
ALLOWPROCLISTEN=dhclient
ALLOWPROCLISTEN=sshd
ALLOWPROCLISTEN=systemd-resolve

# SSH Configuration
ALLOW_SSH_ROOT_USER=no
ALLOW_SSH_PROT_V1=0

# Disable some common false positive checks
DISABLE_TESTS=suspscan hidden_procs deleted_files packet_cap_apps apps
EOF

success "Configuration patched successfully."

# Try update
log "Updating RKHunter data files..."
if ! rkhunter --update --quiet; then
  error "Update failed (mirrors may be unavailable). Will retry during cron job."
fi

# Setup cron
CRON_FILE="/etc/cron.d/rkhunter-daily"
DAILY_SCRIPT="/usr/local/bin/rkhunter-daily.sh"

log "Creating daily cron job at 03:00 in $CRON_FILE..."
cat > "$CRON_FILE" <<EOF
# Daily RKHunter scan – installed by configure_rkhunter.sh
0 3 * * * root ${DAILY_SCRIPT} >> /var/log/rkhunter-cron.log 2>&1
EOF

# Create cron task script
cat > "$DAILY_SCRIPT" <<'EOF'
#!/bin/bash
EMAIL="email"
WEBHOOK_URL="production_website_url"
HEALTH_URL="${WEBHOOK_URL}/health"
REPORT_URL="${WEBHOOK_URL}/report"
LOGFILE="/var/log/rkhunter.log"
HOSTNAME=$(hostname)

# Update rkhunter database
rkhunter --update --quiet || echo "RKHunter update failed" | mail -s "[RKHunter] Update failed on $HOSTNAME" "$EMAIL"

# Clear previous log before scan
> "$LOGFILE"

# Run scan and write to log
rkhunter --cronjob --enable all --skip-keypress --logfile "$LOGFILE" || true

# Send log to webhook
if [[ -f "$LOGFILE" ]] && curl -s -f "$HEALTH_URL" &>/dev/null; then
  curl -fsS -X POST \
       -H "X-Server: $HOSTNAME" \
       -F "logfile=@$LOGFILE" "$REPORT_URL" || \
  echo "Failed to send log to webhook" | mail -s "[RKHunter] Webhook failure on $HOSTNAME" "$EMAIL"
elif [[ -f "$LOGFILE" ]]; then
  echo "Webhook service not healthy, skipping report" | mail -s "[RKHunter] Webhook unavailable on $HOSTNAME" "$EMAIL"
fi

# Send custom mail if warnings/errors detected
if grep -q -E '\[.*(Warning|Error).*\]' "$LOGFILE"; then
  echo -e "🛡️ RKHunter scan on $HOSTNAME found potential issues.\n\nPlease check Discord or the full log at: $LOGFILE" \
    | mail -s "[RKHunter] Suspicious activity detected on $HOSTNAME" "$EMAIL"
fi

# Update property database
rkhunter --propupd --quiet || true
EOF

chmod +x "$DAILY_SCRIPT"
success "Daily scan configured. Logs will be sent at 3:00 AM."

# === Run initial scan and report ===
log "Running initial scan..."
> "$LOG_FILE"
rkhunter -c --enable all --skip-keypress --logfile "$LOG_FILE" || true

# Send scan result to webhook
HEALTH_URL="${WEBHOOK_URL}/health"
REPORT_URL="${WEBHOOK_URL}/report"
if curl -s -f "$HEALTH_URL" &>/dev/null; then
  log "Sending initial scan log to webhook..."
  curl -fsS -X POST \
       -H "X-Server: $(hostname)" \
       -F "logfile=@$LOG_FILE" "$REPORT_URL" || log "Webhook failed (ignored)"
else
  log "Webhook service not healthy, skipping report."
fi

# Send custom mail if warnings/errors detected
if grep -q -E '\[.*(Warning|Error).*\]' "$LOG_FILE"; then
  echo -e "🛡️ RKHunter initial scan on $(hostname) found potential issues.\n\nCheck Discord or the log at: $LOG_FILE" \
    | mail -s "[RKHunter] Initial scan alert on $(hostname)" "$EMAIL"
fi

# Update property database after initial scan
log "Updating property database after initial scan..."
rkhunter --propupd --quiet --logfile "$LOG_FILE" || error "Failed to update property database"

success "RKHunter setup complete. Daily and initial scan logged."
log "A backup of the original configuration was created at $BACKUP_FILE"
