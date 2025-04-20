import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import { snsRouter } from './routes/sns';
import { logger } from './utils/logger';

dotenv.config();

const app = express();

// Support both JSON and text/plain (SNS may send either)
app.use(bodyParser.json());
app.use(bodyParser.text({ type: 'text/plain' }));

app.use(snsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`[READY] Listening on port ${PORT}`));
