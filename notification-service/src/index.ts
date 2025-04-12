// src/index.ts
import { consumeInventoryStatusUpdated } from './queues/notificationConsumer';

// Start consuming 'inventory.status.updated' messages from RabbitMQ
consumeInventoryStatusUpdated()
  .then(() => {
    console.log('✅ Started consuming inventory.status.updated messages');
  })
  .catch((error) => {
    console.error('❌ Error starting the consumer:', error);
  });
