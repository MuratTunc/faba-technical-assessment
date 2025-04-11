// src/index.ts
import { sequelize } from './config/database';
import { OrderModel } from './models/order';
import { consumeOrders } from './queues/orderConsumer';

// Sync models and start consuming messages
sequelize.sync({ force: false })
  .then(async () => {
    console.log('✅ Tables synced with the database');
    await consumeOrders();  // Start consuming messages from RabbitMQ
  })
  .catch((error) => {
    console.error('❌ Error syncing tables:', error);
  });
