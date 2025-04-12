import { createClient } from 'redis';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

const IDEMPOTENCY_TTL = 300; // 5 minutes in seconds

// 🚀 Initialize Redis client
const redisClient = createClient({ url: 'redis://redis:6379' });

redisClient.connect().then(() => {
  logger.info('🔗 Connected to Redis');
}).catch((error) => {
  logger.error('❌ Failed to connect to Redis:', error);
  process.exit(1);  // Don't continue without Redis
});

// 🔁 Middleware for handling idempotent requests
export const idempotencyMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const idempotencyKey = req.headers['idempotency-key'] as string;

  if (!idempotencyKey) {
    logger.warn('❌ Missing Idempotency-Key header');
    res.status(400).json({ message: 'Missing Idempotency-Key header' });
    return;
  }

  try {
    const cached = await redisClient.get(idempotencyKey);

    if (cached && cached !== '{"status":"processing"}') {
      logger.info(`🔁 Duplicate request for key: ${idempotencyKey}`);
      res.status(409).json({ message: 'Duplicate request', data: JSON.parse(cached) });
      return;
    }

    // Save processing state
    await redisClient.set(idempotencyKey, JSON.stringify({ status: 'processing' }), { EX: IDEMPOTENCY_TTL });

    (req as any).idempotencyKey = idempotencyKey;
    logger.info(`🧭 Proceeding with idempotent request: ${idempotencyKey}`);
    next();
  } catch (err) {
    logger.error('❌ Redis error during idempotency check:', err);
    res.status(500).json({ message: 'Internal Server Error (Redis)' });
  }
};

// 📦 Utility to cache response data
export const cacheResponse = async (key: string, data: any): Promise<void> => {
  try {
    await redisClient.set(key, JSON.stringify(data), { EX: IDEMPOTENCY_TTL });
    logger.info(`✅ Cached response for key: ${key}`);
  } catch (err) {
    logger.error('❌ Failed to cache response:', err);
  }
};
