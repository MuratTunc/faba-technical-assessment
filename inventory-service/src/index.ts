import { consumeOrderCreated } from './queues/inventoryConsumer';
import logger from './utils/logger';  // Import the custom logger utility

// Start consuming 'order.created' messages from RabbitMQ
consumeOrderCreated()
  .then(() => {
    logger.info('✅ Started consuming order.created messages');
  })
  .catch((error) => {
    logger.error('❌ Error starting the consumer:', error);
  });
