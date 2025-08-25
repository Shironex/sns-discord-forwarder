/**
 * AWS SNS Webhook Handler
 *
 * This module handles incoming AWS SNS (Simple Notification Service) notifications,
 * specifically designed for Amazon SES (Simple Email Service) email events.
 *
 * Supported SNS message types:
 * - SubscriptionConfirmation: Initial subscription verification from AWS
 * - Notification: Email delivery events (Bounce, Complaint, Delivery)
 *
 * The handler verifies SNS signatures for security, parses email notifications,
 * and forwards formatted alerts to Discord with color-coded embeds.
 */

import express, { Request, Response, Router } from 'express';
import { SNSEvent } from '@/types/aws';
import { verifySnsSignature } from '@/utils/verifySignature';
import { sendToDiscord } from '@/utils/discordNotifier';
import { logger } from '@/utils/logger';
import type { ParsedNotification } from '@/types/sns';
import axios from 'axios';

// Create Express router for SNS-related endpoints
export const snsRouter: Router = express.Router();

snsRouter.post('/sns', async (req: Request, res: Response): Promise<void> => {
  let rawBody = req.body;

  try {
    rawBody = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (err) {
    logger.error('[SNS] Body parsing failed:', err);
    res.status(400).send('Bad Request: Invalid body format');
    return;
  }

  const body = rawBody as SNSEvent;

  if (!body?.Type || !body.MessageId || !body.Message) {
    logger.error('[SNS] Invalid SNS message structure.', body);
    res.status(400).send('Bad Request: Missing required SNS fields');
    return;
  }

  logger.info('[SNS] Received request. Type:', body.Type);
  logger.debug('[SNS] Payload:', body);

  switch (body.Type) {
    case 'SubscriptionConfirmation':
      if (!body.SubscribeURL) {
        res.status(400).send('Missing SubscribeURL');
        return;
      }

      try {
        logger.info('[SNS] Confirming subscription via:', body.SubscribeURL);
        await axios.get(body.SubscribeURL);
        logger.info('[SNS] Subscription confirmed.');
        res.status(200).send('Subscription confirmed');
      } catch (err) {
        logger.error('[SNS] Subscription confirmation failed:', err);
        res.status(500).send('Failed to confirm subscription');
      }

      return;

    case 'Notification': {
      const isValid = await verifySnsSignature(body);

      if (!isValid) {
        logger.error('[SNS] Signature verification failed');
        res.status(403).send('Forbidden: Invalid SNS signature');
        return;
      }

      let parsed: ParsedNotification;
      try {
        parsed = JSON.parse(body.Message);
      } catch (err) {
        logger.error('[SNS] JSON parse failed:', err);
        res.status(400).send('Bad Request: Invalid JSON body');
        return;
      }

      const type = parsed.notificationType as 'Bounce' | 'Complaint' | 'Delivery' | string;

      switch (type) {
        case 'Bounce': {
          const emails =
            parsed.bounce?.bouncedRecipients?.map((r) => r.emailAddress).join(', ') || 'unknown';
          await sendToDiscord(`📩 **Bounce** detected:\n\`${emails}\``, {
            title: 'Bounce',
            color: 0xffa500,
            timestamp: true,
          });
          break;
        }

        case 'Complaint': {
          const emails =
            parsed.complaint?.complainedRecipients?.map((r) => r.emailAddress).join(', ') ||
            'unknown';
          await sendToDiscord(`🚨 **Complaint** received:\n\`${emails}\``, {
            title: 'Complaint',
            color: 0xff0000,
            timestamp: true,
          });
          break;
        }

        case 'Delivery': {
          const emails = parsed.delivery?.recipients?.join(', ') || 'unknown';
          await sendToDiscord(`✅ **Delivered to:**\n\`${emails}\``, {
            title: 'Delivery',
            color: 0x57f287,
            timestamp: true,
          });
          break;
        }

        default: {
          await sendToDiscord(
            `ℹ️ **Unhandled notification type** \`${type}\`:\n\`\`\`json\n${body.Message}\n\`\`\``,
            {
              title: 'Unhandled notification',
              color: 0x5865f2,
              timestamp: true,
            },
          );
          break;
        }
      }

      res.status(200).send('Notification processed');
      return;
    }

    default:
      logger.error('[SNS] Unknown message type:', body.Type);
      res.status(400).send('Bad Request: Unknown SNS Type');
      return;
  }
});
