#!/bin/bash

# Colors for better readability
GREEN="\e[32m"
RED="\e[31m"
RESET="\e[0m"

# Function for logging
log() {
    echo -e "${GREEN}[INFO]${RESET} $1"
}

error() {
    echo -e "${RED}[ERROR]${RESET} $1"
}

add_cron_job() {
    CRON_JOB="0 7 * * * /home/$USER/vps-configure/modules/monitor_logs.sh"
    (crontab -l 2>/dev/null | grep -F -q "$CRON_JOB") && {
        echo "Cron job already exists."
        } || {
        (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
        echo "Added cron job: $CRON_JOB"
    }
}

make_scripts_executable() {
    SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
    find "$SCRIPT_DIR" -type f -iname "*.sh" -exec chmod +x {} \;
    echo -e "${GREEN}[INFO]${RESET} Set executable permissions for all .sh scripts in directory $SCRIPT_DIR"
}

# Check if script is running as root
if [ "$EUID" -ne 0 ]; then
    error "Run script as root."
    exit 1
fi

# Set executable permissions for all scripts
make_scripts_executable

# Path to modules directory
MODULES_DIR="./modules"

# List of modules to execute
MODULES=(
    "update_system.sh"
    "configure_ssh.sh"
    "configure_ufw.sh"
    "configure_fail2ban.sh"
    "configure_rkhunter.sh"
    "configure_unattended_upgrades.sh"
    "monitor_logs.sh"
)

# Execute each module
for MODULE in "${MODULES[@]}"; do
    if [ -f "$MODULES_DIR/$MODULE" ]; then
        log "Executing module: $MODULE"
        bash "$MODULES_DIR/$MODULE"
    else
        error "Module $MODULE does not exist in directory $MODULES_DIR."
    fi
done

add_cron_job

log "Configuration completed."
