// src/index.ts
import { sequelize } from './config/database';
import { InventoryModel } from './models/inventory';
import { consumeOrderCreated } from './queues/inventoryConsumer';

// Sync models and start consuming messages
sequelize.sync({ force: false })
  .then(async () => {
    console.log('✅ Tables synced with the database');
    await consumeOrderCreated();  // Start consuming 'order.created' messages from RabbitMQ
  })
  .catch((error) => {
    console.error('❌ Error syncing tables:', error);
  });
