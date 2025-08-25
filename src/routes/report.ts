/**
 * RKHunter Log Processing Endpoint
 *
 * This module handles RKHunter (Rootkit Hunter) security scan log files,
 * parsing them into structured Discord embeds with relevant security information.
 *
 * Features:
 * - File upload handling with size limits
 * - RKHunter log parsing and field extraction
 * - Color-coded Discord alerts based on scan results
 * - Server identification via headers
 * - Automatic temporary file cleanup
 */

import express, { Request, Response, Router } from 'express';
import { sendToDiscord } from '../utils/discordNotifier';
import { logger } from '../utils/logger';
import { parseRkhunterLogFields } from '../utils';
import os from 'os';
import fs from 'fs';
import multer from 'multer';

// Configure multer for secure file upload handling
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 10 * 1024 * 1024 }, // limit 10MB
});

export const reportRouter: Router = express.Router();

interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

reportRouter.post(
  '/report',
  upload.single('logfile'),
  async (req: MulterRequest, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        res.status(400).send('No log file uploaded');
        return;
      }

      const serverName = req.headers['x-server']?.toString() || 'Unknown Server';

      const filePath = req.file.path;
      const logContent = fs.readFileSync(filePath, 'utf-8');

      logger.info(`[REPORT] Processing log from server: ${serverName}`);

      const fields = parseRkhunterLogFields(logContent);

      fields.unshift({ name: 'Server', value: serverName, inline: true });

      const warningCount = fields.find((f) => f.name === 'Warnings')?.value || '0';
      const errorCount = fields.find((f) => f.name === 'Errors')?.value || '0';

      logger.info(`[REPORT] Warnings: ${warningCount}`);
      logger.info(`[REPORT] Errors: ${errorCount}`);

      await sendToDiscord('📋 **RKHunter Scan Summary**', {
        title: `RKHunter Log - ${serverName}`,
        color:
          parseInt(errorCount) > 0 ? 0xff0000 : parseInt(warningCount) > 0 ? 0xffaa00 : 0x00ff00,
        timestamp: true,
        fields,
      });

      await sendToDiscord('📄 Full scan log attached:', {
        title: `📘 Full Log - ${serverName}`,
        timestamp: true,
        color: 0x5865f2,
        filePath,
        fileName: req.file.originalname || 'rkhunter.log',
      });

      fs.unlinkSync(filePath);
      res.status(200).send('Report sent to Discord');
    } catch (err) {
      logger.error('[REPORT] Failed to process report:', err);
      res.status(500).send('Failed to send report');
    }
  },
);
