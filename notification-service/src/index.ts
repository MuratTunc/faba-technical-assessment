import { consumeInventoryStatusUpdated } from './queues/notificationConsumer';
import logger from './utils/logger';  // Importing the logger

// Start consuming 'inventory.status.updated' messages from RabbitMQ
consumeInventoryStatusUpdated()
  .then(() => {
    logger.info('✅ Started consuming inventory.status.updated messages');
  })
  .catch((error) => {
    logger.error('❌ Error starting the consumer:', error);
  });
