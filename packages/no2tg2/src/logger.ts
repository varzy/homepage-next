import pino from 'pino';

export const logger = pino({
  name: 'NO2TG2',
  level: process.env.LOG_LEVEL ?? 'info',
});
