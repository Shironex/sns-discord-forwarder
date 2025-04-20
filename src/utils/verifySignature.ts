import axios from 'axios';
import crypto from 'crypto';
import { SNSEvent } from '../types/aws';
import { logger } from './logger';

export const verifySnsSignature = async (message: SNSEvent): Promise<boolean> => {
  if (!message.SigningCertURL) return false;

  try {
    const { data: cert } = await axios.get(message.SigningCertURL);
    const verifier = crypto.createVerify('sha1WithRSAEncryption');

    let stringToSign = '';
    if (message.Type === 'Notification') {
      stringToSign =
        `Message\n${message.Message}\nMessageId\n${message.MessageId}\n` +
        `Subject\n${message.Subject || ''}\nTimestamp\n${message.Timestamp}\n` +
        `TopicArn\n${message.TopicArn}\nType\n${message.Type}\n`;
    } else {
      return true; // skip non-Notification for now
    }

    verifier.update(stringToSign);
    const signature = Buffer.from(message.Signature, 'base64');

    return verifier.verify(cert, signature);
  } catch (err) {
    logger.error('Signature verification failed:', err);
    return false;
  }
};
