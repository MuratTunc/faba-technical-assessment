import { DataSource } from 'typeorm';
import { Order } from '../models/order';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.ORDER_POSTGRES_DB_HOST || 'localhost',
  port: parseInt(process.env.ORDER_POSTGRES_DB_PORT || '5432'),
  username: process.env.ORDER_POSTGRES_DB_USER || 'postgres',
  password: process.env.ORDER_POSTGRES_DB_PASS || 'password',
  database: process.env.ORDER_POSTGRES_DB_NAME || 'orders',
  entities: [Order],
  synchronize: true, // turn off in production!
});
