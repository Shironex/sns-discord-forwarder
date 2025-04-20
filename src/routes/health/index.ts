import { Router, Request, Response } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

export const healthRouter = Router();

const startTime = Date.now();
const version = require('../../../package.json').version;
const htmlPath = join(__dirname, '../../public/health.html');
const html = readFileSync(htmlPath, 'utf-8');

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  let str = '';
  if (days > 0) str += `${days} day${days > 1 ? 's' : ''}, `;
  if (hours > 0) str += `${hours} hour${hours > 1 ? 's' : ''}, `;
  str += `${minutes} min`;
  return str;
}

healthRouter.get('/health', (req: Request, res: Response) => {
  const now = Date.now();
  const uptimeSec = Math.floor((now - startTime) / 1000);
  const uptimeStr = formatUptime(uptimeSec);
  const timestamp = new Date(now).toISOString();
  const uptimePercentage = 100.0;
  const status = 'running';

  if (req.headers.accept && req.headers.accept.includes('application/json')) {
    res.status(200).json({
      status,
      uptime: uptimeStr,
      version,
      timestamp,
      uptimePercentage,
    });
  } else {
    res.status(200).type('html').send(html);
  }
});
