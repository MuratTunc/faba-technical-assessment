import { handleOrderCreated } from '../handlers/orderCreatedHandler';
import { handleOrderCancelled } from '../handlers/orderCancelledHandler';
import * as amqp from 'amqplib';
import { config } from '../config';

export const startService = async () => {
  const connection = await amqp.connect(config.rabbitmqUrl);
  const channel = await connection.createChannel();

  // Subscribe to Order Created events
  channel.consume(config.orderQueue, handleOrderCreated, { noAck: false });

  // Subscribe to Order Cancelled events
  channel.consume(config.orderQueue, handleOrderCancelled, { noAck: false });

  console.log('Order Service is running...');
};
