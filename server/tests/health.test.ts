import request from 'supertest';
import { afterAll, expect, it } from 'vitest';

process.env.DATABASE_URL ??= 'postgres://postgres:postgres@localhost:5436/staybook';
process.env.LOG_LEVEL = 'silent';

const { app } = await import('../src/app.js');
const { pool } = await import('../src/db.js');

afterAll(() => pool.end());

it('GET /api/health подтверждает связь с базой', async () => {
  const res = await request(app).get('/api/health');
  expect(res.status).toBe(200);
  expect(res.body).toEqual({ status: 'ok', db: 'ok' });
});

it('неизвестный адрес /api/* даёт 404 NOT_FOUND', async () => {
  const res = await request(app).get('/api/nope');
  expect(res.status).toBe(404);
  expect(res.body.code).toBe('NOT_FOUND');
});
