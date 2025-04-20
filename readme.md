# 📡 AWS SNS → Discord Forwarder

A lightweight Node.js service built with TypeScript that listens for Amazon SNS notifications (like **SES bounces**, **complaints**, or **delivery statuses**) and forwards them to a specified **Discord webhook**.

Perfect for monitoring your email reliability right from Discord.

---

## ✨ Features

- ✅ **Express API** with typed SNS endpoint
- ✅ **AWS SNS signature verification** (secure)
- ✅ **Bounce, Complaint, and Delivery handling**
- ✅ **Custom Discord embeds** (with colors + metadata)
- ✅ **Rate limiting** to protect against abuse
- ✅ **Health check UI** with real-time service status
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
Create a .env file and define:

env
```bash
PORT=3000
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/your-id/your-token
```

### 3. Development
```bash
pnpm dev
```
This will launch the dev server using ts-node.

### 4. Build & Run (production)
```bash
pnpm build

pnpm start
```

### 🧪 Testing
```bash
pnpm test
```
Uses Jest for unit tests. You can expand src/__tests__ to cover more behavior.

### 📘 Endpoints

Route | Method | Description
/sns | POST | AWS SNS POST endpoint
/health | GET | Returns service health status

### 🛠 Technologies
- Express
- TypeScript
- AWS SNS
- Discord Webhooks
- Jest
- Chalk
- Prettier
- ESLint

### 📦 Scripts

Script	Description

- **pnpm dev**: 	Run in dev mode (ts-node)
- **pnpm build**: 	Compile TypeScript to dist/
- **pnpm start**: 	Run compiled server
- **pnpm lint**: 	Fix lint issues
- **pnpm format**: 	Format with Prettier
- **pnpm test**: 	Run unit tests with Jest

### 🧩 Example Use Case
You're sending transactional emails via Amazon SES and want to:

get notified in Discord if someone marks your email as spam

monitor delivery success

track bounces in real-time

This service handles that for you ✅

📄 License
MIT — free to use, modify, share.