import { Router } from 'express';
import { Channel } from 'amqplib';
import { idempotencyMiddleware } from '../middleware/idempotencyMiddleware';
import { handleOrderCreate } from '../handlers/order-create';
import { handleOrderCancel } from '../handlers/order-cancel';

export const orderRoute = (channel: Channel): Router => {
  const router = Router();

  router.post('/order-create', idempotencyMiddleware, handleOrderCreate(channel));
  router.post('/order-cancel', idempotencyMiddleware, handleOrderCancel(channel));

  return router;
};