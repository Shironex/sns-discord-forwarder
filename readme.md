# 📡 AWS SNS → Discord + RKHunter Forwarder

A lightweight Node.js service built with TypeScript that listens for **Amazon SNS notifications** and **RKHunter log reports**, forwarding structured alerts to a specified **Discord webhook**.

Perfect for monitoring **email deliverability** and **server security** right from your Discord server.

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

## 🚀 Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-user/sns-discord-forwarder.git
cd sns-discord-forwarder
pnpm install
```

### 2. Environment Variables

Create a `.env` file and define:

```env
PORT=3000
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-id/your-token
NODE_ENV=development
```

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

## 🔒 RKHunter Integration

A full Bash automation script is included to:

- Install and configure RKHunter
- Patch common false positives
- Schedule **daily cron scans at 03:00**
- Forward logs to your webhook + email
- Include **HTML-style Discord embeds** with warnings, suspicious files, and system info

📍 Logs are parsed and displayed neatly inside Discord embeds.

📤 Cron scan uploads the latest `/var/log/rkhunter.log` via `multipart/form-data`.

🧪 Also supports **manual scan + upload** after setup.

---

## 🧪 Testing

```bash
pnpm test
```

Uses Jest. Add tests under `src/__tests__`.

---

## 📘 Endpoints

| Route     | Method | Description                        |
|-----------|--------|------------------------------------|
| `/sns`    | POST   | AWS SNS notification receiver      |
| `/report` | POST   | Upload RKHunter log for parsing    |
| `/health` | GET    | Returns 200 OK if service is alive |

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

## 📄 License

MIT — free to use, modify, and share.