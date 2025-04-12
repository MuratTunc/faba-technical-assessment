// src/index.ts
import { sequelize } from './config/database';
import { OrderModel } from './models/order';
import { consumeOrders } from './queues/orderConsumer';
import { consumeDLQ } from './queues/orderConsumer'; // Import DLQ consumer function

// Sync models and start consuming messages
sequelize.sync({ force: false })
  .then(async () => {
    console.log('✅ Tables synced with the database');

    // Start consuming messages from the normal order queue
    await consumeOrders();  

    // Start consuming messages from the Dead Letter Queue (DLQ)
    await consumeDLQ();  
  })
  .catch((error) => {
    console.error('❌ Error syncing tables:', error);
  });
