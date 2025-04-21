import { Router, Request, Response } from 'express';
import { version } from '@/package.json';
import { formatUptime, readHtmlFile } from '@/utils';

export const healthRouter: Router = Router();

const startTime = Date.now();
const html = readHtmlFile('health.html');

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
