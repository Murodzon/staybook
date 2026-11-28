import { app, logger } from './app.js';
import { config } from './config.js';

app.listen(config.port, (err) => {
  if (err) throw err;
  logger.info(`StayBook API: http://localhost:${config.port}`);
});
