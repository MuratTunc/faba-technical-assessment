import { Router, Request, Response, NextFunction } from 'express';
import { Channel } from 'amqplib';
import { idempotencyMiddleware, cacheResponse } from '../middleware/idempotencyMiddleware';
import logger from '../utils/logger';
import { CustomError } from '../utils/custom-error';

export const orderRoute = (channel: Channel): Router => {
  const router = Router();

  router.post('/order', idempotencyMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { customerName, items, total, status } = req.body;

    // ✅ Validate request
    if (!customerName || !items || !total || !status) {
      const error = new CustomError(
        'ORDER_VALIDATION_FAILED',
        'Missing customerName, items, total, or status',
        400
      );
      logger.warn(`❌ ${error.code}: ${error.message}`);
      return next(error); // Delegate to centralized error handler
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
      // Send order to RabbitMQ
      channel.sendToQueue('orderQueue', Buffer.from(JSON.stringify(orderData)), {
        persistent: true,
      });

      // Save successful response to Redis
      const idempotencyKey = (req as any).idempotencyKey;
      await cacheResponse(idempotencyKey, { message: 'Order created', orderId: orderData.id });

      logger.info(`📦 Order sent: ${orderData.id} for customer: ${customerName}`);
      res.status(200).json({ message: 'Order created successfully!', orderId: orderData.id });

    } catch (err: any) {
      logger.error(`❌ ORDER_CREATION_FAILED: ${err.message}`, { stack: err.stack });
      return next(
        new CustomError('ORDER_CREATION_FAILED', 'Failed to create order', 500, {
          reason: err.message,
        })
      );
    }
  });

  return router;
};
