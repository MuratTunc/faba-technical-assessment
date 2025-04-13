// src/index.ts
import { sequelize } from './config/database';
import { OrderModel } from './models/order';
import {
  consumeOrders,
  consumeDLQ,
  consumeCancelOrders,
  consumeCancelDLQ,
} from './queues/orderConsumer';
import logger from './utils/logger';

sequelize.sync({ force: false })
  .then(async () => {
    logger.info('✅ Tables synced with the database');

    // Start consuming messages from queues
    await consumeOrders();         // Normal order queue
    await consumeDLQ();            // Dead Letter Queue for orders
    await consumeCancelOrders();   // Normal cancel queue
    await consumeCancelDLQ();      // Dead Letter Queue for cancel
  })
  .catch((error) => {
    logger.error('❌ Error syncing tables: ' + error);
  });
