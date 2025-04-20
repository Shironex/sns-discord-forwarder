import express from 'express';
import dotenv from 'dotenv';
import { snsRouter } from './routes/sns';
import { logger } from './utils/logger';

dotenv.config();

const app = express();
app.use(snsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => logger.info(`[READY] Listening on port ${PORT}`));
