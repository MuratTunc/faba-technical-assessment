// src/index.ts
import { consumeOrderCreated } from './queues/inventoryConsumer';

// Start consuming 'order.created' messages from RabbitMQ
consumeOrderCreated()
  .then(() => {
    console.log('✅ Started consuming order.created messages');
  })
  .catch((error) => {
    console.error('❌ Error starting the consumer:', error);
  });
