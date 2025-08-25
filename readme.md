# 📡 AWS SNS → Discord + RKHunter Forwarder

A lightweight Node.js service built with TypeScript that listens for **Amazon SNS notifications** and **RKHunter log reports**, forwarding structured alerts to a specified **Discord webhook**.

Perfect for monitoring **email deliverability** and **server security** right from your Discord server.

## 🔍 What This Service Does

This service provides **real-time monitoring** for two critical areas:

1. **📧 Email Deliverability Monitoring**: Tracks SES (Simple Email Service) events including bounces, complaints, and successful deliveries
2. **🔒 Server Security Monitoring**: Processes RKHunter security scan logs and forwards security alerts with detailed system information

All notifications are automatically formatted into rich Discord embeds with color-coding, timestamps, and relevant metadata.

---

## ✨ Features

- ✅ **Express API** with SNS + file upload support
- ✅ **AWS SNS signature verification**
- ✅ **Bounce, Complaint, and Delivery handling (SES)**
- ✅ **RKHunter scan parser** with Discord alerts
- ✅ **Discord embeds** with color-coded metadata and attachments
- ✅ **Rate limiting** to protect against abuse
- ✅ **Health check** UI with real-time status
- ✅ **Custom RKHunter setup script with cron**
- ✅ **Unit-tested** with Jest
- ✅ **Linted & formatted** with ESLint + Prettier

---

## 📁 Project Structure

```
sns-discord-forwarder/
├── src/
│   ├── index.ts              # Main application entry point & setup
│   ├── routes/
│   │   ├── sns.ts           # AWS SNS webhook handler (email events)
│   │   ├── report.ts        # RKHunter log processing endpoint
│   │   └── health/
│   │       └── index.ts     # Health check endpoint
│   ├── utils/
│   │   ├── index.ts         # Utility functions (parsing, formatting)
│   │   ├── discordNotifier.ts # Discord webhook client
│   │   ├── logger.ts        # Logging utility
│   │   └── verifySignature.ts # SNS signature verification
│   ├── types/
│   │   ├── aws.ts           # AWS/SNS TypeScript definitions
│   │   └── sns.ts           # SES notification type definitions
│   └── public/
│       └── health.html      # Health check UI template
├── tests/
│   └── utils/               # Unit tests for utility functions
├── package.json
└── README.md
```

### Key Components Explained

| Component | Purpose | Key Features |
|-----------|---------|--------------|
| `src/index.ts` | Application bootstrap | Express setup, middleware, route registration |
| `src/routes/sns.ts` | Email event processing | SNS signature verification, SES event routing |
| `src/routes/report.ts` | Security log processing | File upload, RKHunter parsing, Discord formatting |
| `src/utils/discordNotifier.ts` | Discord integration | Webhook sending, embed formatting, file attachments |
| `src/utils/index.ts` | Data processing | Log parsing, timestamp extraction, uptime formatting |

---

## 🚀 Getting Started

### 1. Clone and install

```bash
git clone https://github.com/Shironex/sns-discord-forwarder.git
cd sns-discord-forwarder
pnpm install
```

### 2. Configuration

Create a `.env` file in the project root:

```env
# Server Configuration
PORT=3000                          # Port for the HTTP server (default: 3000)
NODE_ENV=production                # Environment: 'development' or 'production'

# Discord Integration
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-webhook-id/your-token

# Optional: Custom Server Settings
# RATE_LIMIT_WINDOW_MS=3600000     # SNS rate limit window (default: 1 hour)
# RATE_LIMIT_MAX_REQUESTS=10       # Max SNS requests per window (default: 10)
# MAX_FILE_SIZE=10485760           # Max upload size in bytes (default: 10MB)
```

#### Environment Variables Explained

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `PORT` | No | `3000` | HTTP server port |
| `NODE_ENV` | No | `development` | Affects static file paths and logging |
| `DISCORD_WEBHOOK_URL` | **Yes** | - | Discord webhook URL for notifications |
| `RATE_LIMIT_WINDOW_MS` | No | `3600000` | SNS rate limit window in milliseconds |
| `RATE_LIMIT_MAX_REQUESTS` | No | `10` | Maximum SNS requests per window |
| `MAX_FILE_SIZE` | No | `10485760` | Maximum file upload size in bytes |

#### Discord Webhook Setup

1. Go to your Discord server settings
2. Navigate to Integrations → Webhooks
3. Create a new webhook or copy an existing one
4. Copy the webhook URL to your `.env` file

---

## 💻 Development

```bash
pnpm dev
```

Runs the dev server using `ts-node`.

## 🔧 Production

```bash
pnpm build
pnpm start
```

Compiles to `dist/` and runs with Node.

---

## 🔧 Usage Examples

### AWS SES Integration

#### 1. Set up SNS Topic
```bash
# Create SNS topic for email notifications
aws sns create-topic --name email-monitoring

# Subscribe your service endpoint to the SNS topic
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:123456789012:email-monitoring \
  --protocol https \
  --endpoint https://your-domain.com/sns
```

#### 2. Configure SES to Send Notifications
```bash
# Enable bounce notifications for your domain/identity
aws ses set-identity-notification-topic \
  --identity your-domain.com \
  --notification-type Bounce \
  --sns-topic arn:aws:sns:us-east-1:123456789012:email-monitoring

# Enable complaint notifications
aws ses set-identity-notification-topic \
  --identity your-domain.com \
  --notification-type Complaint \
  --sns-topic arn:aws:sns:us-east-1:123456789012:email-monitoring

# Enable delivery notifications (optional)
aws ses set-identity-notification-topic \
  --identity your-domain.com \
  --notification-type Delivery \
  --sns-topic arn:aws:sns:us-east-1:123456789012:email-monitoring
```

### RKHunter Integration

#### Automated Setup
A full Bash automation script is included to:

- Install and configure RKHunter
- Patch common false positives
- Schedule **daily cron scans at 03:00**
- Forward logs to your webhook + email
- Include **HTML-style Discord embeds** with warnings, suspicious files, and system info

#### Manual Log Upload
```bash
# After running RKHunter scan
curl -X POST \
  -F "logfile=@/var/log/rkhunter.log" \
  -H "x-server: production-server-01" \
  https://your-domain.com/report
```

#### Cron Job Setup
```bash
# Add to /etc/crontab for daily scans
0 3 * * * root rkhunter --check --cronjob --report-warnings-only && curl -X POST -F "logfile=@/var/log/rkhunter.log" -H "x-server: $(hostname)" https://your-domain.com/report
```

### Discord Notifications

The service sends different types of notifications:

#### Email Events
- **🟠 Bounces**: Invalid email, full mailbox, blocked sender
- **🔴 Complaints**: Recipients marked email as spam
- **🟢 Deliveries**: Successful email delivery (if enabled)

#### Security Scans
- **🟢 Clean scans**: No warnings or errors
- **🟠 Warnings**: Potential issues detected
- **🔴 Critical errors**: Serious security findings

Each notification includes:
- Timestamp and server identification
- Color-coded severity levels
- Detailed field information
- Full log file attachments (for security scans)

---

## 🧪 Testing

```bash
pnpm test
```

Uses Jest. Add tests under `src/__tests__`.

---

## 📘 API Endpoints

### `/sns` - AWS SNS Webhook
**Method:** `POST` | **Content-Type:** `application/json` or `text/plain`

Handles incoming AWS SNS notifications, primarily SES (Simple Email Service) events.

**Supported SNS Message Types:**
- `SubscriptionConfirmation` - AWS subscription verification
- `Notification` - Email delivery events (Bounce, Complaint, Delivery)

**Security:**
- SNS signature verification to prevent spoofing
- Rate limiting (10 requests per hour)
- Request body size limit (10MB)

**Example SES Bounce Notification:**
```json
{
  "Type": "Notification",
  "MessageId": "12345678-1234-1234-1234-123456789012",
  "Message": "{\"notificationType\":\"Bounce\", \"bounce\": {\"bouncedRecipients\": [{\"emailAddress\":\"user@example.com\"}]}}"
}
```

### `/report` - RKHunter Log Upload
**Method:** `POST` | **Content-Type:** `multipart/form-data`

Processes RKHunter security scan logs and forwards structured reports to Discord.

**Parameters:**
- `logfile` (file) - RKHunter log file (max 10MB)
- `x-server` (header, optional) - Server identifier for multi-server setups

**Response:**
```json
{
  "message": "Report sent to Discord"
}
```

**Features:**
- Automatic log parsing and field extraction
- Color-coded Discord embeds based on severity
- File attachment support for full log access
- Server identification via headers

### `/health` - Health Check
**Method:** `GET` | **Accepts:** `application/json` or `text/html`

Service health monitoring endpoint with uptime and version information.

**JSON Response:**
```json
{
  "status": "running",
  "uptime": "2 days, 3 hours, 45 min",
  "version": "1.0.0",
  "timestamp": "2023-01-01T12:00:00.000Z",
  "uptimePercentage": 100.0
}
```

**HTML Response:**
Returns a formatted health status page with real-time information.

---

## 🛠 Technologies

- Express
- TypeScript
- AWS SNS + SES
- Discord Webhooks
- Multer (file upload)
- Jest (unit testing)
- Chalk
- Prettier + ESLint

---

## 📦 Scripts

| Script         | Description                     |
|----------------|---------------------------------|
| `pnpm dev`     | Run in dev mode (`ts-node`)     |
| `pnpm build`   | Compile TypeScript              |
| `pnpm start`   | Run compiled code               |
| `pnpm lint`    | Lint with ESLint                |
| `pnpm format`  | Format code with Prettier       |
| `pnpm test`    | Run unit tests with Jest        |

---

## 🧩 Use Cases

- ✅ Get notified when SES mail bounces, fails, or is marked spam
- ✅ Parse and forward **RKHunter logs** from VPS
- ✅ Detect suspicious activity or potential compromise
- ✅ Centralize logs in **Discord with full visibility**

---

## 🐛 Troubleshooting

### Common Issues

#### SNS Signature Verification Failed
```
Error: [SNS] Signature verification failed
```
**Solution:** Ensure your SNS endpoint is publicly accessible with HTTPS. AWS SNS requires valid SSL certificates.

#### Discord Webhook Errors
```
Error: Failed to send Discord embed message
```
**Solutions:**
- Verify `DISCORD_WEBHOOK_URL` is correct
- Check webhook permissions in Discord
- Ensure the webhook hasn't been deleted

#### File Upload Issues
```
Error: No log file uploaded
```
**Solution:** Ensure you're sending the file with the correct form field name `logfile` and using `multipart/form-data` content type.

#### Rate Limiting
```
Error: Too many requests, please try again later
```
**Solution:** The SNS endpoint is rate-limited to 10 requests per hour. This is normal AWS behavior.

### Debug Mode

Enable detailed logging by setting `NODE_ENV=development`:

```bash
NODE_ENV=development pnpm start
```

This provides more verbose logging for troubleshooting.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and add tests
4. Run the test suite: `pnpm test`
5. Submit a pull request

### Development Guidelines

- **Code Style**: Follow ESLint and Prettier configurations
- **Testing**: Add unit tests for new features
- **Documentation**: Update README for API changes
- **Types**: Use TypeScript interfaces for new data structures

---

## 📊 Monitoring & Logs

### Log Levels
- **INFO**: Normal operations and important events
- **WARN**: Non-critical issues and warnings
- **ERROR**: Failures that need attention
- **DEBUG**: Detailed information (development mode only)

### Health Check Integration
Integrate the `/health` endpoint with monitoring services like:
- UptimeRobot
- Pingdom
- AWS CloudWatch
- Prometheus

Example health check configuration:
```bash
curl -f https://your-domain.com/health || exit 1
```

---

## 📄 License

MIT — free to use, modify, and share.