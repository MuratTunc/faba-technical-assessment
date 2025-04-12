import { Router, Request, Response, NextFunction } from 'express';
import { Channel } from 'amqplib';
import { idempotencyMiddleware, cacheResponse } from '../middleware/idempotencyMiddleware';
import logger from '../utils/logger';  // Importing your winston logger

export const orderRoute = (channel: Channel): Router => {
  const router = Router();

  // POST /order route
  router.post('/order', idempotencyMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { customerName, items, total, status } = req.body;

    if (!customerName || !items || !total || !status) {
      logger.warn('❌ Invalid order data: Missing customerName, items, total, or status');
      res.status(400).json({ message: 'Invalid order data' });
      return;
    }

    const orderData = {
      id: `${Date.now()}`,
      customerName,
      items,
      total,
      status,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    try {
      // Send order to RabbitMQ queue
      channel.sendToQueue('orderQueue', Buffer.from(JSON.stringify(orderData)), {
        persistent: true,
      });

      // Save successful response to Redis
      const idempotencyKey = (req as any).idempotencyKey;
      await cacheResponse(idempotencyKey, { message: 'Order created', orderId: orderData.id });

      logger.info(`📦 Order sent: ${orderData.id} for customer: ${customerName}`);
      res.status(200).json({ message: 'Order created successfully!', orderId: orderData.id });

      // You should not return the response in an async function. Instead, you just complete the request/response cycle.
      next(); // This would allow handling other middlewares or error handling if necessary.
    } catch (err) {
      logger.error(`❌ Failed to send order: ${err}`);
      res.status(500).json({ message: 'Failed to create order' });
    }
  });

  return router;
};
