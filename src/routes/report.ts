import express, { Request, Response, Router } from 'express';
import { sendToDiscord } from '../utils/discordNotifier';
import { logger } from '../utils/logger';

export const reportRouter: Router = express.Router();

reportRouter.post('/report', async (req: Request, res: Response): Promise<void> => {
  try {
    const logContent = req.body;
    if (!logContent || logContent.length < 10) {
      res.status(400).send('Invalid log data');
      return;
    }

    await sendToDiscord(
      `🛡️ **RKHunter Report**
    \`\`\`
    ${logContent.slice(-1900)}
    \`\`\``,
      {
        title: 'RKHunter Log',
        color: 0x7289da,
        timestamp: true,
      },
    );

    res.status(200).send('Report sent to Discord');
  } catch (err) {
    logger.error('[REPORT] Failed to process report:', err);
    res.status(500).send('Failed to send report');
  }
});
