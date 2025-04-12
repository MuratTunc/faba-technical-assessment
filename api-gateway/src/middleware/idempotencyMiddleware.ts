import { createClient } from 'redis';
import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';  // Assuming you have a logger utility

const client = createClient({
  url: 'redis://redis:6379'
});

client.connect().catch((error) => {
  console.error('❌ Failed to connect to Redis:', error);
  process.exit(1);  // Ensure the app does not run without Redis
});

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const idempotencyKey = req.headers['idempotency-key'] as string;

  if (!idempotencyKey) {
    res.status(400).json({ message: 'Missing Idempotency-Key header' });
    logger.warn('❌ Missing Idempotency-Key header');
    return;
  }

  try {
    // Check if the response for this idempotency key is cached
    const cachedResponse = await client.get(idempotencyKey);

    if (cachedResponse) {
      logger.info(`🔁 Duplicate request detected for key: ${idempotencyKey}. Returning cached response.`);
      res.status(409).json({ message: 'Duplicate request', data: JSON.parse(cachedResponse) });
      return;
    }

    // Cache the processing state for the idempotency key
    await client.set(idempotencyKey, JSON.stringify({ status: 'processing' }), { EX: 300 });
    (req as any).idempotencyKey = idempotencyKey;

    logger.info(`✔️ Proceeding with request for key: ${idempotencyKey}`);
    next();
  } catch (err) {
    console.error('❌ Redis error:', err);
    logger.error('❌ Redis error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

// Function to cache responses for successful requests
export const cacheResponse = async (key: string, data: any) => {
  try {
    await client.set(key, JSON.stringify(data), { EX: 300 });
    logger.info(`✔️ Cached response for key: ${key}`);
  } catch (err) {
    console.error('❌ Error caching response:', err);
    logger.error('❌ Error caching response:', err);
  }
};
