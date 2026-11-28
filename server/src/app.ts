import express from 'express';
import helmet from 'helmet';
import { pino } from 'pino';
import { pinoHttp } from 'pino-http';
import { config } from './config.js';
import { pool } from './db.js';

export const logger = pino({
  level: config.logLevel,
  redact: ['req.headers.cookie', 'req.headers.authorization'],
});

export const app = express();

app.use(helmet());
app.use(pinoHttp({ logger }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'ok' });
  } catch (err) {
    req.log.error({ err }, 'health: база недоступна');
    res.status(503).json({ status: 'error', db: 'unavailable' });
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ code: 'NOT_FOUND', message: 'Не найдено' });
});
