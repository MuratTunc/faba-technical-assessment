// src/middleware/requestLogger.ts

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const { method, url, headers, body } = req;

  // Log request details
  logger.info(`Incoming Request: ${method} ${url}`);
  logger.info(`Request Headers: ${JSON.stringify(headers)}`);
  logger.info(`Request Body: ${JSON.stringify(body)}`);

  // Capture the response and log it after processing
  res.on('finish', () => {
    logger.info(`Response Status: ${res.statusCode}`);
  });

  next();
};

export default requestLogger;
