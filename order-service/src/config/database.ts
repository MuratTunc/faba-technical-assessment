// src/config/database.ts
import { Sequelize } from 'sequelize';

// Create a new Sequelize instance
export const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.ORDER_POSTGRES_DB_HOST || 'localhost',
  username: process.env.ORDER_POSTGRES_DB_USER || 'user',
  password: process.env.ORDER_POSTGRES_DB_PASSWORD || 'password',
  database: process.env.ORDER_POSTGRES_DB_NAME || 'orderdb',
});
