import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from build-tools/.env
dotenv.config({ path: path.resolve(__dirname, '../../../build-tools/.env') });

console.log(process.env.ORDER_SERVICE_PORT);

export const config = {
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost',
  orderQueue: process.env.ORDER_QUEUE || 'orderQueue',
  inventoryQueue: process.env.INVENTORY_QUEUE || 'inventoryQueue',
  retryDelay: Number(process.env.RETRY_DELAY) || 5000,
};
