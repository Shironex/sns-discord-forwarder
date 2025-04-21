import axios from 'axios';
import { logger } from './logger';

/**
 * Options for configuring Discord embed messages
 *
 * @interface DiscordEmbedOptions
 * @property {string} [title] - The title of the embed
 * @property {number} [color] - The color of the embed sidebar (hexadecimal)
 * @property {boolean} [timestamp] - Whether to include a timestamp in the embed
 */
interface DiscordEmbedOptions {
  title?: string;
  color?: number;
  timestamp?: boolean;
}

/**
 * Sends a message to Discord using a webhook
 *
 * @param {string} message - The message content to send
 * @param {DiscordEmbedOptions} [options] - Optional configuration for the Discord embed
 * @returns {Promise<void>} A promise that resolves when the message is sent
 *
 * @example
 * // Send a basic message
 * await sendToDiscord('Hello world');
 *
 * // Send a formatted message with options
 * await sendToDiscord('System alert!', {
 *   title: 'Error',
 *   color: 0xff0000,
 *   timestamp: true
 * });
 */
export const sendToDiscord = async (message: string, options?: DiscordEmbedOptions) => {
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
