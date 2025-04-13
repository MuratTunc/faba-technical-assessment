
import { Request, Response, NextFunction } from 'express';
import { Channel } from 'amqplib';
import { cacheResponse } from '../middleware/idempotencyMiddleware';
import logger from '../utils/logger';
import { CustomError } from '../utils/custom-error';

export const handleOrderCancel = (channel: Channel) => async (req: Request, res: Response, next: NextFunction) => {
  const { orderId, reason } = req.body;

  if (!orderId) {
    const error = new CustomError('ORDER_CANCEL_VALIDATION_FAILED', 'Missing orderId in request', 400);
    logger.warn(`❌ ${error.code}: ${error.message}`);
    return next(error);
  }

  const cancelEvent = {
    orderId,
    reason: reason || 'No reason provided',
    cancelledAt: new Date(),
  };

  try {
    channel.sendToQueue('orderCancelQueue', Buffer.from(JSON.stringify(cancelEvent)), { persistent: true });

    const idempotencyKey = (req as any).idempotencyKey;
    await cacheResponse(idempotencyKey, { message: 'Order cancellation sent', orderId });

    logger.info(`🛑 Order cancel requested: ${orderId} | Reason: ${cancelEvent.reason}`);
    res.status(200).json({ message: 'Order cancellation requested', orderId });
    next();
  } catch (err: any) {
    logger.error(`❌ ORDER_CANCEL_FAILED: ${err.message}`, { stack: err.stack });
    return next(new CustomError('ORDER_CANCEL_FAILED', 'Failed to send order cancel request', 500, { reason: err.message }));
  }
};
