// src/index.ts
import { sequelize } from './config/database';
import { OrderModel } from './models/order';
import { consumeOrders } from './queues/orderConsumer';
import { consumeDLQ } from './queues/orderConsumer'; // Import DLQ consumer function
import logger from './utils/logger'; // Import the logger utility

// Sync models and start consuming messages
sequelize.sync({ force: true })
  .then(async () => {
    logger.info('✅ Tables synced with the database');

    // Start consuming messages from the normal order queue
    await consumeOrders();

    // Start consuming messages from the Dead Letter Queue (DLQ)
    await consumeDLQ();
  })
  .catch((error) => {
    logger.error('❌ Error syncing tables: ' + error);
  });
