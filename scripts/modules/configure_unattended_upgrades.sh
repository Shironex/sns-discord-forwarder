#!/bin/bash
#
# configure_unattended_upgrades.sh
# Enables unattended-upgrades + mail alerts + Discord webhooks
#
set -euo pipefail

# ── CONFIG ─────────────────────────────────────────────────────────────────────

EMAIL="" # ← Your email address
DISCORD_WEBHOOK_URL=""  # ← YOUR DISCORD WEBHOOK HERE
APT_NOTIFY_SCRIPT="/usr/local/bin/apt-notify.sh"
APT_HOOK_CONF="/etc/apt/apt.conf.d/99notify"
AUTO_UPGRADES_CONF="/etc/apt/apt.conf.d/20auto-upgrades"
UNATTENDED_CONF="/etc/apt/apt.conf.d/50unattended-upgrades"

# ── UTILS ──────────────────────────────────────────────────────────────────────

log()    { echo -e "\\e[34m[INFO]\\e[0m  $*"; }
success(){ echo -e "\\e[32m[OK]\\e[0m    $*"; }
error()  { echo -e "\\e[31m[ERROR]\\e[0m $*"; }

# ── PREFLIGHT ─────────────────────────────────────────────────────────────────

if [ "$(id -u)" -ne 0 ]; then
    error "Must run as root"; exit 1
fi

# ── INSTALL & ENABLE SERVICE ──────────────────────────────────────────────────

log "Installing unattended-upgrades and ..."
apt-get update
DEBIAN_FRONTEND=noninteractive apt-get install -y unattended-upgrades jq curl

log "Enabling unattended-upgrades service + apt-daily-upgrade.timer..."
systemctl enable --now unattended-upgrades.service >/dev/null 2>&1 || true
systemctl enable --now apt-daily-upgrade.timer >/dev/null 2>&1 || true
success "unattended-upgrades installed & enabled."

# ── AUTO-UPGRADES CONFIG ──────────────────────────────────────────────────────

log "Writing ${AUTO_UPGRADES_CONF}..."
cat > "${AUTO_UPGRADES_CONF}" <<EOF
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade   "1";
EOF
success "Auto-upgrade schedule configured."

# ── UNATTENDED-UPGRADES CONFIG ────────────────────────────────────────────────

log "Patching ${UNATTENDED_CONF}..."
dpkg-query -W -f='${Conffiles}\\n' unattended-upgrades >/dev/null 2>&1 || apt-get install -y --reinstall unattended-upgrades

grep -q "Unattended-Upgrade::Mail" "${UNATTENDED_CONF}" || cat >>"${UNATTENDED_CONF}" <<EOF

// Added by configure_unattended_upgrades.sh
Unattended-Upgrade::Mail "${EMAIL}";
Unattended-Upgrade::MailOnlyOnError "false";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Post-Run-Hook "${APT_NOTIFY_SCRIPT}";
EOF
success "Mail + Post-Run-Hook applied."

# ── APT HOOK CONFIG ───────────────────────────────────────────────────────────

log "Writing APT hook to ${APT_HOOK_CONF}..."
cat > "${APT_HOOK_CONF}" <<EOF
DPkg::Post-Invoke { "test -x '${APT_NOTIFY_SCRIPT}' && '${APT_NOTIFY_SCRIPT}'"; };
EOF
success "APT hook installed."

# ── NOTIFY SCRIPT ─────────────────────────────────────────────────────────────

log "Writing notify script to ${APT_NOTIFY_SCRIPT}..."
cat > "${APT_NOTIFY_SCRIPT}" <<'EOF'
#!/bin/bash
set -euo pipefail

EMAIL="" # ← Your email address
DISCORD_WEBHOOK="" # ← Your Discord webhook URL
HOSTNAME="$(hostname -f)"
LOGFILE="/var/log/unattended-upgrades/unattended-upgrades.log"
HISTFILE="/var/log/apt/history.log"
MAIL_TITLE="[APT] Automatic updates report – $HOSTNAME"

[ -f "$LOGFILE" ] || exit 0

# Get list of packages that have been upgraded
# Check both unattended-upgrades and apt history logs
function get_upgraded_packages() {
    local packages=""
    local packages_detail=""
    
    # Get list of packages from unattended-upgrades log
    if grep -q "Packages that will be upgraded:" "$LOGFILE"; then
        packages=$(grep "Packages that will be upgraded:" "$LOGFILE" | sed 's/.*: //')
    fi
    
    # Get detailed information about upgrades from apt history
    if [ -f "$HISTFILE" ]; then
        # Find the last upgrade session (last "Start-Date" entry)
        local last_upgrade=$(tac "$HISTFILE" | sed -n '/^Start-Date:/,/^End-Date:/ p' | tac)
        
        # Extract package versions (old -> new)
        if [ -n "$last_upgrade" ]; then
            local upgrade_details=$(echo "$last_upgrade" | grep "Upgrade: " | sed 's/Upgrade: //')
            if [ -n "$upgrade_details" ]; then
                # Format upgrade details
                packages_detail=$(echo "$upgrade_details" | tr ',' '\n' | sed 's/^/ • /')
            fi
        fi
    fi
    
    # If details are found, use them; otherwise use a simple list
    if [ -n "$packages_detail" ]; then
        echo -e "Upgrade details:\n$packages_detail"
    elif [ -n "$packages" ]; then
        echo -e "Upgraded packages: $packages"
    else
        echo "No upgraded packages"
    fi
}

# Collect information about errors and warnings
function get_errors_warnings() {
    local errors_warnings=""
    
    if [ -f "$LOGFILE" ]; then
        errors_warnings=$(grep -E 'ERROR|WARNING|CRITICAL|FAIL' "$LOGFILE" | tail -10)
    fi
    
    if [ -n "$errors_warnings" ]; then
        echo -e "Błędy i ostrzeżenia:\n$errors_warnings"
    else
        echo "Brak błędów i ostrzeżeń"
    fi
}

# Get last entries from log
function get_recent_logs() {
    if [ -f "$LOGFILE" ]; then
        tail -15 "$LOGFILE"
    else
        echo "Brak dostępnych logów"
    fi
}

# Get data for reports
UPGRADED_INFO=$(get_upgraded_packages)
ERRORS_INFO=$(get_errors_warnings)
RECENT_LOGS=$(get_recent_logs)
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# Prepare email report
EMAIL_CONTENT="$MAIL_TITLE
Data: $TIMESTAMP
Serwer: $HOSTNAME

=== UPGRADE DETAILS ===
$UPGRADED_INFO

=== ERRORS AND WARNINGS ===
$ERRORS_INFO

=== RECENT LOGS ===
$RECENT_LOGS"

# Send email
echo -e "$EMAIL_CONTENT" | mail -s "$MAIL_TITLE" "$EMAIL"

PACKAGES_TRIMMED=$(echo "$UPGRADED_INFO" | head -c 1000)
ERRORS_TRIMMED=$(echo "$ERRORS_INFO" | head -c 1000)
LOGS_TRIMMED=$(echo "$RECENT_LOGS" | head -c 1000)

JSON=$(jq -n \
  --arg title "Automatic updates report – $HOSTNAME" \
  --arg timestamp "$TIMESTAMP" \
  --arg packages "$PACKAGES_TRIMMED" \
  --arg errors "$ERRORS_TRIMMED" \
  --arg logs "$LOGS_TRIMMED" \
  --arg ts "$(date --utc +%Y-%m-%dT%H:%M:%SZ)" \
  --arg server "$HOSTNAME" \
  '{
    embeds: [ {
      title: $title,
      description: ("Report from " + $timestamp),
      fields: [
        { name: "📦 Upgraded packages", value: ($packages // "No updates"), inline: false },
        { name: "⚠️ Errors and warnings", value: ($errors // "No errors"), inline: false },
        { name: "📜 Recent logs", value: ($logs // "No activity"), inline: false }
      ],
      color: 3447003,
      timestamp: $ts,
      footer: { text: ($server | "Server: " + .) }
    }]
  }'
)

# Send Discord notification
curl -fsS -X POST \
  -H "Content-Type: application/json" \
  -d "$JSON" \
  "$DISCORD_WEBHOOK" \
  || echo "[ERROR] Error sending to Discord webhook"
EOF

chmod +x "${APT_NOTIFY_SCRIPT}"
success "Notify script in place."

log "Reloading APT + systemd..."
systemctl daemon-reexec
success "Setup complete – unattended-upgrades with mail + Discord enabled."