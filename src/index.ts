import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { snsRouter } from '@/routes/sns';
import { logger } from '@/utils/logger';
import { healthRouter } from '@/routes/health';
import rateLimit from 'express-rate-limit';
import path from 'path';

dotenv.config();

const app = express();

//? Support both JSON and text/plain (SNS may send either)
app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'text/plain' }));

const snsLimiter = rateLimit({
  windowMs: 60 * 1000 * 60, // 60 minutes
  max: 10,
  message: { error: 'Too many requests, please try again later.' },
});

app.use('/sns', snsLimiter);

app.use(snsRouter);
app.use(healthRouter);

app.use(express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`[READY] Listening on port ${PORT}`));
