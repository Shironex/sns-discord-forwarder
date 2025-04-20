import axios from 'axios';
import { logger } from './logger';

interface DiscordEmbedOptions {
  title?: string;
  color?: number;
  timestamp?: boolean;
}

export const sendToDiscord = async (
  message: string,
  options?: DiscordEmbedOptions,
) => {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) throw new Error('DISCORD_WEBHOOK_URL not set');

    const embed = {
      embeds: [
        {
          description: message,
          title: options?.title,
          color: options?.color ?? 0x5865f2,
          timestamp: options?.timestamp ? new Date().toISOString() : undefined,
        },
      ],
    };

    await axios.post(webhookUrl, embed);
    logger.info('Sent embed message to Discord.');
  } catch (err) {
    logger.error('Failed to send Discord embed message:', err);
  }
};
