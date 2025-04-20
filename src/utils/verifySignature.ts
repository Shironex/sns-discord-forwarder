import axios from 'axios';
import crypto from 'crypto';
import { SNSEvent } from '../types/aws';
import { logger } from './logger';

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
