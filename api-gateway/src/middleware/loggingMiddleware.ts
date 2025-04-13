// api-gateway/src/middleware/loggingMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export const logIncomingRequest = (req: Request, res: Response, next: NextFunction) => {
  logger.info(`📥 Incoming Request: ${req.method} ${req.url}`);

  if (Object.keys(req.body || {}).length > 0) {
    logger.info(`📦 Request Body: ${JSON.stringify(req.body)}`);
  }

  res.on('finish', () => {
    logger.info(`✅ Response Status: ${res.statusCode}`);
  });

  next();
};
