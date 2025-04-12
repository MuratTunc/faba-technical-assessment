import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import { CustomError } from '../utils/custom-error';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err instanceof CustomError ? err.statusCode : 500;
  const code = err instanceof CustomError ? err.code : 'INTERNAL_SERVER_ERROR';
  const message = err.message || 'Something went wrong';
  const details = err.details || {};

  logger.error(`🚨 ${code}: ${message}`, { stack: err.stack, details });

  res.status(statusCode).json({
    error: {
      code,
      message,
      statusCode,
      ...(Object.keys(details).length && { details }),
    },
  });
};
