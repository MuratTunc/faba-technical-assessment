import { Sequelize } from 'sequelize';
import logger from '../utils/logger';  // Import the logger

// Log database configuration parameters
logger.info(`Database Name: ${process.env.ORDER_POSTGRES_DB_NAME || 'order-db'}`);
logger.info(`Database User: ${process.env.ORDER_POSTGRES_DB_USER || 'order'}`);
logger.info(`Database Host: ${process.env.ORDER_POSTGRES_DB_HOST || 'order-db'}`);
logger.info(`Database Port: 5432`);  // Port is constant
logger.info(`Using PostgreSQL dialect`);

export const sequelize = new Sequelize(
  process.env.ORDER_POSTGRES_DB_NAME || 'order-db',
  process.env.ORDER_POSTGRES_DB_USER || 'order',
  process.env.ORDER_POSTGRES_DB_PASS || 'order_password',
  {
    host: process.env.ORDER_POSTGRES_DB_HOST || 'order-db',
    port: 5432, // Constant port 5432
    dialect: 'postgres',
  }
);
