import { Sequelize } from 'sequelize';

export const sequelize = new Sequelize(
  process.env.INVENTORY_POSTGRES_DB_NAME || 'inventory-db', // Default to 'inventory-db'
  process.env.INVENTORY_POSTGRES_DB_USER || 'inventory', // Default to 'inventory'
  process.env.INVENTORY_POSTGRES_DB_PASSWORD || 'inventory_password', // Default to 'inventory_password'
  {
    host: process.env.INVENTORY_POSTGRES_DB_HOST || 'inventory-db', // Default to 'inventory-db'
    port: parseInt(process.env.INVENTORY_POSTGRES_DB_PORT || '5433', 10), // Default to 5433
    dialect: 'postgres', // PostgreSQL
  }
);
