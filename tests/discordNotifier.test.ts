import { sendToDiscord } from '../src/utils/discordNotifier';
import axios from 'axios';

jest.mock('axios');

describe('sendToDiscord', () => {
  beforeEach(() => {
    process.env.DISCORD_WEBHOOK_URL = 'https://discord.test/webhook';
    jest.clearAllMocks();
  });

  it('should send embed with default options', async () => {
    (axios.post as jest.Mock).mockResolvedValueOnce({});
    await sendToDiscord('test message');
    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ embeds: [expect.objectContaining({ description: 'test message' })] })
    );
  });

  it('should send embed with custom options', async () => {
    (axios.post as jest.Mock).mockResolvedValueOnce({});
    await sendToDiscord('custom', { title: 'T', color: 0x123456, timestamp: true });
    expect(axios.post).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        embeds: [
          expect.objectContaining({
            title: 'T',
            color: 0x123456,
            description: 'custom',
            timestamp: expect.any(String),
          }),
        ],
      })
    );
  });
}); 