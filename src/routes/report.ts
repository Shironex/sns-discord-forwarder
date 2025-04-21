import express, { Request, Response, Router } from 'express';
import { sendToDiscord } from '../utils/discordNotifier';
import { logger } from '../utils/logger';
import { extractScanTimestamps } from '../utils';
import os from 'os';
import { v4 as uuid } from 'uuid';
import path from 'path';
import fs from 'fs';
export const reportRouter: Router = express.Router();

reportRouter.post('/report', async (req: Request, res: Response): Promise<void> => {
  try {
    const logContent = req.body;
    if (!logContent || logContent.length < 10) {
      res.status(400).send('Invalid log data');
      return;
    }

    const serverName = req.headers['x-server']?.toString() || 'Unknown Server';
    const lines = logContent.split('\n');

    const warningLines = lines.filter((line: string) =>
      line.match(/\[\s*Warning\s*\]/i) || line.toLowerCase().includes('warning')
    );

    const errorLines = lines.filter((line: string) =>
      line.match(/\[\s*Error\s*\]/i) || line.toLowerCase().includes('error')
    );

    const { start, end, duration } = extractScanTimestamps(logContent);

    const fields = [
      { name: 'Server', value: serverName, inline: true },
      { name: 'Warnings', value: `${warningLines.length}`, inline: true },
      { name: 'Errors', value: `${errorLines.length}`, inline: true },
    ];

    if (start && end && duration) {
      fields.push(
        { name: 'Started At', value: start, inline: false },
        { name: 'Ended At', value: end, inline: false },
        { name: 'Duration', value: duration, inline: true },
      );
    }

    await sendToDiscord('📋 **RKHunter Scan Summary**', {
      title: `RKHunter Log - ${serverName}`,
      color: errorLines.length ? 0xff0000 : warningLines.length ? 0xffaa00 : 0x00ff00,
      timestamp: true,
      fields,
    });

    // Write log to temp file
    const tempDir = os.tmpdir();
    const filename = `rkhunter-${serverName}-${uuid().slice(0, 8)}.log`;
    const filePath = path.join(tempDir, filename);

    fs.writeFileSync(filePath, logContent);

    // Send file to Discord
    await sendToDiscord('📄 Full scan log attached:', {
      title: `📘 Full Log - ${serverName}`,
      timestamp: true,
      color: 0x7289da,
      filePath,
      fileName: filename,
    });

    fs.unlinkSync(filePath); // cleanup

    res.status(200).send('Report sent to Discord');
  } catch (err) {
    logger.error('[REPORT] Failed to process report:', err);
    res.status(500).send('Failed to send report');
  }
});
