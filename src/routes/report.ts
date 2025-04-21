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

    // get server name from header
    const serverName = req.headers['x-server'] || 'Unknown Server';

    // check if there are warnings in the logs
    const hasWarnings = logContent.includes('Warning:') || logContent.includes('[Warning]');
    const hasErrors = logContent.includes('Error:') || logContent.includes('[Error]');

    // determine color based on content
    let color = 0x00ff00; // green for OK
    if (hasErrors) {
      color = 0xff0000; // red for errors
    } else if (hasWarnings) {
      color = 0xffaa00; // orange for warnings
    }

    // extract important parts of the log
    let importantParts = '';
    const lines = logContent.split('\n');

    // find lines with warnings or errors
    const warningLines = lines.filter(
      (line: string) =>
        line.includes('Warning:') ||
        line.includes('[Warning]') ||
        line.includes('Error:') ||
        line.includes('[Error]'),
    );

    if (warningLines.length > 0) {
      importantParts =
        '**❗ Wykryte problemy:**\n```\n' +
        warningLines.slice(0, 15).join('\n') +
        (warningLines.length > 15 ? '\n...' : '') +
        '\n```\n';
    }

    // full logs (limited)
    const truncatedLog = logContent.slice(-1500);

    await sendToDiscord(
      `🛡️ **RKHunter Report** | Serwer: \`${serverName}\`
      
${importantParts}**Last part of logs:**
\`\`\`
${truncatedLog}
\`\`\``,
      {
        title: `RKHunter Log - ${serverName}`,
        color: color,
        timestamp: true,
      },
    );

    res.status(200).send('Report sent to Discord');
  } catch (err) {
    logger.error('[REPORT] Failed to process report:', err);
    res.status(500).send('Failed to send report');
  }
});
