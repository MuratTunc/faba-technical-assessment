import { Request, Response, NextFunction } from 'express';
import { Channel } from 'amqplib';
import { cacheResponse } from '../middleware/idempotencyMiddleware';
import logger from '../utils/logger';
import { CustomError } from '../utils/custom-error';

export const handleOrderCreate = (channel: Channel) => async (req: Request, res: Response, next: NextFunction) => {
  const { customerName, item, total, status } = req.body;

  if (!customerName || !item || !total || !status) {
    const error = new CustomError(
      'ORDER_VALIDATION_FAILED',
      'Missing customerName, item, total, or status',
      400
    );
    logger.warn(`❌ ${error.code}: ${error.message}`);
    return next(error);
  }

  const orderData = {
    id: `${Date.now()}`,
    customerName,
    item,
    total,
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    channel.sendToQueue('orderQueue', Buffer.from(JSON.stringify(orderData)), { persistent: true });
    const idempotencyKey = (req as any).idempotencyKey;
    await cacheResponse(idempotencyKey, { message: 'Order created', orderId: orderData.id });

    logger.info(`📦 Order sent: ${orderData.id} for customer: ${customerName}`);
    res.status(200).json({ message: 'Order created successfully!', orderId: orderData.id });
    next();
  } catch (err: any) {
    logger.error(`❌ ORDER_CREATION_FAILED: ${err.message}`, { stack: err.stack });
    return next(new CustomError('ORDER_CREATION_FAILED', 'Failed to create order', 500, { reason: err.message }));
  }
};
