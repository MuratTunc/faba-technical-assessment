import 'reflect-metadata';
import { AppDataSource } from './src/config/ormconfig'
import { consumeOrders } from './src/queues/orderConsumer'; // or wherever your consumer is

AppDataSource.initialize()
  .then(() => {
    console.log('✅ Connected to PostgreSQL via TypeORM');
    consumeOrders();
  })
  .catch((error) => {
    console.error('❌ TypeORM DB init error:', error);
  });
