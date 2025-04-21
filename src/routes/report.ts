import express, { Request, Response, Router } from 'express';
import { sendToDiscord } from '../utils/discordNotifier';
import { logger } from '../utils/logger';
import { parseRkhunterLogFields } from '../utils';
import os from 'os';
import fs from 'fs';
import multer from 'multer';

// Konfiguracja multer do obsługi plików
const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 10 * 1024 * 1024 }, // limit 10MB
});

export const reportRouter: Router = express.Router();
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

// Endpoint /report obsługuje zarówno bezpośrednie teksty jak i pliki
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

      logger.info(`[REPORT] Server: ${serverName}`);

      // Uzyskaj pola przy użyciu funkcji parseRkhunterLogFields
      const fields = parseRkhunterLogFields(logContent);

      // Dodaj informację o serwerze jako pierwsze pole
      fields.unshift({ name: 'Server', value: serverName, inline: true });

      // Znajdź liczby ostrzeżeń i błędów dla określenia koloru
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

      fs.unlinkSync(filePath); // Cleanup temp file
      res.status(200).send('Report sent to Discord');
    } catch (err) {
      logger.error('[REPORT] Failed to process report:', err);
      res.status(500).send('Failed to send report');
    }
  },
);
