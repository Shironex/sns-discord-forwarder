import axios from 'axios';
import crypto from 'crypto';
import { SNSEvent } from '@/types/aws';
import { logger } from './logger';

/**
 * Builds a string to sign based on the SNS message type and content
 *
 * @param {SNSEvent} message - The SNS message to build a string from
 * @returns {string} A formatted string containing the message fields to be signed
 * @throws {Error} If the message type is not supported
 *
 * @private
 */
function buildStringToSign(message: SNSEvent): string {
  let str = '';

  switch (message.Type) {
    case 'Notification':
      str += `Message\n${message.Message}\n`;
      str += `MessageId\n${message.MessageId}\n`;
      if (message.Subject) str += `Subject\n${message.Subject}\n`;
      str += `Timestamp\n${message.Timestamp}\n`;
      str += `TopicArn\n${message.TopicArn}\n`;
      str += `Type\n${message.Type}\n`;
      break;

    case 'SubscriptionConfirmation':
    case 'UnsubscribeConfirmation':
      str += `Message\n${message.Message}\n`;
      str += `MessageId\n${message.MessageId}\n`;
      str += `SubscribeURL\n${message.SubscribeURL}\n`;
      str += `Timestamp\n${message.Timestamp}\n`;
      str += `Token\n${message.Token}\n`;
      str += `TopicArn\n${message.TopicArn}\n`;
      str += `Type\n${message.Type}\n`;
      break;

    default:
      throw new Error('Unsupported message type');
  }

  return str;
}

/**
 * Verifies the signature of an SNS message to ensure authenticity
 *
 * @param {SNSEvent} message - The SNS message to verify
 * @returns {Promise<boolean>} A promise that resolves to true if the signature is valid, false otherwise
 *
 * @example
 * const isValid = await verifySnsSignature(snsMessage);
 * if (isValid) {
 *   // Process the message
 * } else {
 *   // Reject the message
 * }
 */
export const verifySnsSignature = async (message: SNSEvent): Promise<boolean> => {
  try {
    const { data: cert } = await axios.get(message.SigningCertURL);
    const verifier = crypto.createVerify('sha1WithRSAEncryption');
    const stringToSign = buildStringToSign(message);
    verifier.update(stringToSign, 'utf8');

    const signature = Buffer.from(message.Signature, 'base64');
    const isValid = verifier.verify(cert, signature);

    if (!isValid) logger.error('[SNS] Signature check failed.');
    return isValid;
  } catch (err) {
    logger.error('Signature verification failed:', err);
    return false;
  }
};
