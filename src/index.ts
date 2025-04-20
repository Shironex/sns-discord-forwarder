import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL || "";

// Parse both JSON and text/plain (SNS sometimes sends as text)
app.use(bodyParser.json());
app.use(bodyParser.text({ type: "text/plain" }));

app.post("/sns", async (req: Request, res: Response): Promise<void> => {
  const type = req.headers["x-amz-sns-message-type"] as string;
  const raw = req.body;
  const message = typeof raw === "string" ? JSON.parse(raw) : raw;

  console.log(`[SNS] Received request. Type: ${type}`);
  console.log("[SNS] Payload:", JSON.stringify(message, null, 2));

  if (!message || !type) {
    res.status(400).send("Invalid request");
    return;
  }

  if (type === "SubscriptionConfirmation" && message.SubscribeURL) {
    console.log("[SNS] Confirming subscription via:", message.SubscribeURL);
    try {
      await axios.get(message.SubscribeURL);
      console.log("[SNS] Subscription confirmed.");
    } catch (error) {
      console.error("[SNS] Failed to confirm subscription:", error);
    }
    res.status(200).send("OK");
    return;
  }

  if (type === "Notification" && message.Message) {
    try {
      const parsed = JSON.parse(message.Message);

      if (parsed.notificationType === "Bounce") {
        const emails = parsed.bounce.bouncedRecipients.map((r: any) => r.emailAddress).join(", ");
        await sendDiscord(`📩 **Bounce**: \`${emails}\``);
      } else if (parsed.notificationType === "Complaint") {
        const emails = parsed.complaint.complainedRecipients.map((r: any) => r.emailAddress).join(", ");
        await sendDiscord(`🚨 **Complaint**: \`${emails}\``);
      } else {
        await sendDiscord(`ℹ️ SES Notification:\n\`\`\`json\n${message.Message}\n\`\`\``);
      }
    } catch (err) {
      console.error("[SNS] Failed to process notification:", err);
    }

    res.status(200).send("OK");
    return;
  }

  res.status(200).send("Ignored");
});

async function sendDiscord(content: string) {
  if (!DISCORD_WEBHOOK_URL) return;
  try {
    await axios.post(DISCORD_WEBHOOK_URL, { content });
  } catch (err) {
    console.error("❌ Failed to send to Discord:", err);
  }
}

app.listen(PORT, () => {
  console.log(`[READY] Listening on port ${PORT}`);
});
