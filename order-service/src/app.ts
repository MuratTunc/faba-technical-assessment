// src/app.ts
import { consumeOrders } from './queues/orderConsumer';
import dotenv from 'dotenv';
dotenv.config();

consumeOrders();  // Start consuming from RabbitMQ

// initialize DB connection
