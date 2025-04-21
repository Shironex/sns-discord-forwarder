#!/bin/bash

GREEN="\e[32m"
RED="\e[31m"
RESET="\e[0m"

log() {
    echo -e "${GREEN}[INFO]${RESET} $1"
}

error() {
    echo -e "${RED}[ERROR]${RESET} $1"
}

if [ "$EUID" -ne 0 ]; then
    error "Run script as root."
    exit 1
fi

EMAIL="email"

log "Installing Postfix, mailutils and rsyslog..."
apt update -y
DEBIAN_FRONTEND=noninteractive apt install -y postfix mailutils libsasl2-modules rsyslog

log "Configuring Postfix (SES relay)..."
postconf -e "relayhost = [email-smtp.eu-central-1.amazonaws.com]:587"
postconf -e "smtp_sasl_auth_enable = yes"
postconf -e "smtp_sasl_security_options = noanonymous"
postconf -e "smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd"
postconf -e "smtp_use_tls = yes"
postconf -e "smtp_tls_security_level = encrypt"
postconf -e "smtp_tls_note_starttls_offer = yes"
postconf -e "sender_canonical_maps = hash:/etc/postfix/sender_canonical"
postconf -e "mydestination ="

log "Creating SMTP credentials file..."
cat > /etc/postfix/sasl_passwd <<EOF
[email-smtp.eu-central-1.amazonaws.com]:587 AWS_ACCESS_KEY_ID:AWS_SECRET_ACCESS_KEY
EOF

chmod 600 /etc/postfix/sasl_passwd
postmap /etc/postfix/sasl_passwd

log "Creating sender_canonical (rewrite root → mail)..."
cat > /etc/postfix/sender_canonical <<EOF
root $EMAIL
EOF

postmap /etc/postfix/sender_canonical

log "Configuring rsyslog to write mail logs..."
cat > /etc/rsyslog.d/50-default.conf <<EOF
mail.*                          -/var/log/mail.log
mail.err                        /var/log/mail.err
EOF

touch /var/log/mail.log /var/log/mail.err
chown syslog:adm /var/log/mail.log /var/log/mail.err
chmod 640 /var/log/mail.log /var/log/mail.err

systemctl restart rsyslog
systemctl restart postfix

log "Test sending message..."
read -p "Enter email address for test sending (e.g. Gmail): " TEST_EMAIL
echo "Test message from server $(hostname)" | mail -r $EMAIL -s "Postfix SES test" "$TEST_EMAIL"

log "Done. Check your inbox: $TEST_EMAIL"
