import dotenv from 'dotenv';
import path from 'path';
import logger from '../utils/logger'; // Importing the logger

// Load environment variables from build-tools/.env
dotenv.config({ path: path.resolve(__dirname, '../../../build-tools/.env') });

// Log environment variables for testing purposes
logger.info(`📦 Loaded environment variables from '../../../build-tools/.env'`);  
logger.info(`📍 Inventory service port: ${process.env.INVENTORY_SERVICE_PORT}`);
logger.info(`🔗 RabbitMQ URL: ${process.env.RABBITMQ_URL}`);

export const config = {
  rabbitmqUrl: process.env.RABBITMQ_URL || 'amqp://localhost',
  orderQueue: process.env.ORDER_QUEUE || 'orderQueue',
  inventoryQueue: process.env.INVENTORY_QUEUE || 'inventoryQueue',
  retryDelay: Number(process.env.RETRY_DELAY) || 5000,
};

// Log configuration after loading it
logger.info(`🔧 Configuration loaded:`);
logger.info(`  RabbitMQ URL: ${config.rabbitmqUrl}`);
logger.info(`  Order Queue: ${config.orderQueue}`);
logger.info(`  Inventory Queue: ${config.inventoryQueue}`);
logger.info(`  Retry Delay: ${config.retryDelay}ms`);
