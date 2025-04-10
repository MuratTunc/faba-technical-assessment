// config/database.ts
import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize(
  process.env.ORDER_POSTGRES_DB_NAME || 'order-db',
  process.env.ORDER_POSTGRES_DB_USER || 'order',
  process.env.ORDER_POSTGRES_DB_PASS || 'order_password',
  {
    host: process.env.ORDER_POSTGRES_DB_HOST || 'order-db',
    port: parseInt(process.env.ORDER_POSTGRES_DB_PORT || '5432'),
    dialect: 'postgres',
  }
);
