/**
 * AWS SNS → Discord + RKHunter Forwarder
 *
 * A lightweight Node.js service that forwards AWS SNS notifications and RKHunter
 * security scan reports to Discord webhooks with rich embed formatting.
 *
 * Features:
 * - AWS SNS signature verification for security
 * - SES email bounce/complaint/delivery notifications
 * - RKHunter log parsing and Discord alerts
 * - Rate limiting and health monitoring
 * - File upload support for log processing
 *
 * @author Shironex
 * @license MIT
 */

import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { snsRouter } from '@/routes/sns';
import { logger } from '@/utils/logger';
import { healthRouter } from '@/routes/health';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { reportRouter } from './routes/report';

// Load environment variables from .env file
dotenv.config();

// Initialize Express application
const app = express();

app.set('trust proxy', 1);

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.text({ type: 'text/plain', limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const snsLimiter = rateLimit({
  windowMs: 60 * 1000 * 60,
  max: 10,
  message: { error: 'Too many requests, please try again later.' },
});

app.use('/sns', snsLimiter);

app.use(snsRouter);
app.use(healthRouter);
app.use(reportRouter);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.send('OK');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`[READY] Listening on port ${PORT}`));
