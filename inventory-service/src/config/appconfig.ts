import dotenv from 'dotenv';
import path from 'path';
import logger from '../utils/logger'; // Use your custom logger

// Load environment variables from build-tools/.env
dotenv.config({ path: path.resolve(__dirname, '../../../build-tools/.env') });

// Extract and export config values
export const config = {
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost',
  orderQueue: process.env.ORDER_QUEUE || 'orderQueue',
  inventoryQueue: process.env.INVENTORY_QUEUE || 'inventoryQueue',
  retryDelay: Number(process.env.RETRY_DELAY) || 5000,
  inventoryServicePort: process.env.INVENTORY_SERVICE_PORT || 3002,
};

// Log all config values
logger.info('🛠️ Loaded Inventory Service Configuration:');
logger.info(`➡️ INVENTORY_SERVICE_PORT: ${config.inventoryServicePort}`);
logger.info(`➡️ RABBITMQ_URL: ${config.rabbitmqUrl}`);
logger.info(`➡️ ORDER_QUEUE: ${config.orderQueue}`);
logger.info(`➡️ INVENTORY_QUEUE: ${config.inventoryQueue}`);
logger.info(`➡️ RETRY_DELAY: ${config.retryDelay}ms`);
