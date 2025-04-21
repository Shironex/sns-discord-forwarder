import axios from 'axios';
import { logger } from './logger';
import FormData from 'form-data';
import fs from 'fs';

/**
 * Options for configuring Discord embed fields
 *
 * @interface DiscordEmbedField
 * @property {string} name - The name of the field
 * @property {string} value - The value of the field
 * @property {boolean} [inline] - Whether to display the field inline (default: false)
 */
interface DiscordEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

/**
 * Options for configuring Discord embed messages
 *
 * @interface DiscordEmbedOptions
 * @property {string} [title] - The title of the embed
 * @property {number} [color] - The color of the embed sidebar (hexadecimal)
 * @property {boolean} [timestamp] - Whether to include a timestamp in the embed
 * @property {DiscordEmbedField[]} [fields] - Additional fields to display in the embed
 * @property {string} [filePath] - The path to the file to attach
 * @property {string} [fileName] - The name of the file to attach
 */
interface DiscordEmbedOptions {
  title?: string;
  color?: number;
  timestamp?: boolean;
  fields?: DiscordEmbedField[];
  filePath?: string;
  fileName?: string;
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
 *
 * // Send a message with fields
 * await sendToDiscord('System alert!', {
 *   title: 'Error',
 *   color: 0xff0000,
 *   timestamp: true,
 *   fields: [
 *     { name: 'Field 1', value: 'Value 1', inline: true },
 *     { name: 'Field 2', value: 'Value 2', inline: true },
 *   ]
 * });
 */
export const sendToDiscord = async (message: string, options?: DiscordEmbedOptions) => {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) throw new Error('DISCORD_WEBHOOK_URL not set');

    if (typeof message !== 'string') {
      throw new Error('sendToDiscord first argument must be a string');
    }

    // Build embed
    const embed = {
      description: message,
      title: options?.title,
      color: options?.color ?? 0x5865f2,
      timestamp: options?.timestamp ? new Date().toISOString() : undefined,
      fields: options?.fields || [],
    };

    await axios.post(webhookUrl, {
      embeds: [embed], // uwzględnij tylko poprawne pola!
    });
    
    logger.info('[Discord] Embed sent');
    
    if (options?.filePath) {
      const form = new FormData();
      form.append('payload_json', JSON.stringify({
        content: '📎 Full scan log attached.',
      }));
      form.append('file', fs.createReadStream(options.filePath), options.fileName || 'log.txt');
    
      await axios.post(webhookUrl, form, {
        headers: form.getHeaders(),
      });
    
      logger.info('[Discord] File attached');
    }
  } catch (err) {
    logger.error('Failed to send Discord embed message:', err);
  }
};
