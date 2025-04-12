// api-gateway/src/middleware/idempotencyMiddleware.ts
import { createClient } from 'redis';
import { Request, Response, NextFunction } from 'express';

const client = createClient({
  url: 'redis://redis:6379'
});

client.connect().catch(console.error);

export const idempotencyMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const idempotencyKey = req.headers['idempotency-key'] as string;

  if (!idempotencyKey) {
    res.status(400).json({ message: 'Missing Idempotency-Key header' });
    return;
  }

  try {
    const cachedResponse = await client.get(idempotencyKey);

    if (cachedResponse) {
      console.log('🔁 Duplicate request detected. Returning cached response.');
      res.status(409).json({ message: 'Duplicate request', data: JSON.parse(cachedResponse) });
      return;
    }

    await client.set(idempotencyKey, JSON.stringify({ status: 'processing' }), { EX: 300 });
    (req as any).idempotencyKey = idempotencyKey;
    next();
  } catch (err) {
    console.error('Redis error:', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

export const cacheResponse = async (key: string, data: any) => {
  await client.set(key, JSON.stringify(data), { EX: 300 });
};
