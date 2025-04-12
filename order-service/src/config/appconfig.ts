import dotenv from 'dotenv';
import path from 'path';
import logger from '../utils/logger';  // Importing the logger

// Load environment variables from build-tools/.env
dotenv.config({ path: path.resolve(__dirname, '../../../build-tools/.env') });

// Log all config parameters
logger.info(`RabbitMQ URL: ${process.env.RABBITMQ_URL || 'amqp://localhost'}`);
logger.info(`Order Queue: ${process.env.ORDER_QUEUE || 'orderQueue'}`);
logger.info(`Inventory Queue: ${process.env.INVENTORY_QUEUE || 'inventoryQueue'}`);
logger.info(`Retry Delay: ${Number(process.env.RETRY_DELAY) || 5000}`);

export const config = {
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost',
  orderQueue: process.env.ORDER_QUEUE || 'orderQueue',
  inventoryQueue: process.env.INVENTORY_QUEUE || 'inventoryQueue',
  retryDelay: Number(process.env.RETRY_DELAY) || 5000,
};
