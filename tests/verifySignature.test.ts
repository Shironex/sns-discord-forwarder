import { verifySnsSignature } from '../src/utils/verifySignature';
import axios from 'axios';
import crypto from 'crypto';

jest.mock('axios');

const mockCert = '-----BEGIN CERTIFICATE-----\nMIIBIjANBgkqh...\n-----END CERTIFICATE-----';

describe('verifySnsSignature', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return false if SigningCertURL is missing', async () => {
    // @ts-expect-error
    expect(await verifySnsSignature({})).toBe(false);
  });

  it('should return false for non-Notification type', async () => {
    const event = {
      Type: 'SubscriptionConfirmation',
      SigningCertURL: 'https://example.com/cert.pem',
    };
    // @ts-expect-error
    expect(await verifySnsSignature(event)).toBe(false);
  });

  it('should return false if axios.get throws', async () => {
    (axios.get as jest.Mock).mockRejectedValueOnce(new Error('fail'));
    const event = {
      Type: 'Notification',
      SigningCertURL: 'https://example.com/cert.pem',
      Message: '',
      MessageId: '',
      Subject: '',
      Timestamp: '',
      TopicArn: '',
      Signature: '',
      SignatureVersion: '',
    };
    expect(await verifySnsSignature(event)).toBe(false);
  });

  it('should return false if axios.get resolves to undefined', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce(undefined);
    const event = {
      Type: 'Notification',
      SigningCertURL: 'https://example.com/cert.pem',
      Message: '',
      MessageId: '',
      Subject: '',
      Timestamp: '',
      TopicArn: '',
      Signature: '',
      SignatureVersion: '',
    };
    expect(await verifySnsSignature(event)).toBe(false);
  });

  it('should return false if axios.get resolves to object without data', async () => {
    (axios.get as jest.Mock).mockResolvedValueOnce({});
    const event = {
      Type: 'Notification',
      SigningCertURL: 'https://example.com/cert.pem',
      Message: '',
      MessageId: '',
      Subject: '',
      Timestamp: '',
      TopicArn: '',
      Signature: '',
      SignatureVersion: '',
    };
    expect(await verifySnsSignature(event)).toBe(false);
  });
}); 