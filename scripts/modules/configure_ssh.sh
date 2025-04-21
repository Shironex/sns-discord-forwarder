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

# Path to SSH configuration file
SSHD_CONFIG="/etc/ssh/sshd_config"

# Create new user
read -p "Enter new username: " NEW_USER
if id "$NEW_USER" &>/dev/null; then
    log "User $NEW_USER already exists."
else
    adduser "$NEW_USER"
    log "Created user $NEW_USER."
fi

# Add user to sudo group
usermod -aG sudo "$NEW_USER"
log "Added user $NEW_USER to sudo group."

# Copy SSH keys from root to new user
if [ -f /root/.ssh/authorized_keys ]; then
    mkdir -p /home/$NEW_USER/.ssh
    cp /root/.ssh/authorized_keys /home/$NEW_USER/.ssh/
    chown -R $NEW_USER:$NEW_USER /home/$NEW_USER/.ssh
    chmod 700 /home/$NEW_USER/.ssh
    chmod 600 /home/$NEW_USER/.ssh/authorized_keys
    log "Copied SSH keys from root to user $NEW_USER."
else
    error "No /root/.ssh/authorized_keys file. Ensure SSH keys are configured for root."
fi

# SSH configuration
# Disable root login
if grep -q "^PermitRootLogin" $SSHD_CONFIG; then
    sed -i "s/^PermitRootLogin.*/PermitRootLogin no/" $SSHD_CONFIG
else
    echo "PermitRootLogin no" >> $SSHD_CONFIG
fi
log "Disabled root login via SSH."

# Disable password authentication
if grep -q "^PasswordAuthentication" $SSHD_CONFIG; then
    sed -i "s/^PasswordAuthentication.*/PasswordAuthentication no/" $SSHD_CONFIG
else
    echo "PasswordAuthentication no" >> $SSHD_CONFIG
fi
log "Disabled password authentication via SSH."

# Optional port change
read -p "Do you want to change the default SSH port (22)? (y/n): " change_port
if [[ "$change_port" == "y" ]]; then
    read -p "Enter new SSH port (e.g., 2222): " new_port
    if grep -q "^Port" $SSHD_CONFIG; then
        sed -i "s/^Port.*/Port $new_port/" $SSHD_CONFIG
    else
        echo "Port $new_port" >> $SSHD_CONFIG
    fi
    log "Changed SSH port to $new_port."
    
    # Ensure new port is allowed in UFW
    ufw allow "$new_port"/tcp
    log "Added UFW rule for port $new_port."
fi

# Restart SSH service
systemctl restart ssh
log "Restarted SSH service to apply changes."

log "Ensure you can log in as $NEW_USER before disconnecting the current session."
