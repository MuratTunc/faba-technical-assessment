// src/queues/orderConsumer.ts

import amqp from 'amqplib';
import { OrderModel } from '../models/order';

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';
const ORDER_QUEUE = process.env.ORDER_QUEUE || 'orderQueue';
const ORDER_EXCHANGE = 'order-events';
const ORDER_CREATED_EVENT = 'order.created';

async function connectToRabbitMQ() {
  try {
    const connection = await amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
    const channel = await connection.createChannel();

    // Assert the order queue for consuming new orders
    await channel.assertQueue(ORDER_QUEUE, { durable: true });

    // Assert a topic exchange for publishing events
    await channel.assertExchange(ORDER_EXCHANGE, 'topic', { durable: true });

    return channel;
  } catch (error) {
    console.error('❌ Failed to connect to RabbitMQ:', error);
    process.exit(1);
  }
}

export const consumeOrders = async () => {
  const channel = await connectToRabbitMQ();

  console.log(`[🟢] Waiting for messages in ${ORDER_QUEUE}`);

  channel.consume(ORDER_QUEUE, async (msg) => {
    if (msg !== null) {
      try {
        const order = JSON.parse(msg.content.toString());
        console.log('📩 Received order:', order);

        const savedOrder = await OrderModel.create({
          id: order.id,
          customerName: order.customerName,
          items: order.items,
          total: order.total,
          status: order.status,
        });

        console.log('💾 Order saved to database');

        const orderCreatedEvent = {
          event: ORDER_CREATED_EVENT,
          data: savedOrder.toJSON(),
        };

        // Publish to the exchange with routing key 'order.created'
        channel.publish(
          ORDER_EXCHANGE,
          ORDER_CREATED_EVENT,
          Buffer.from(JSON.stringify(orderCreatedEvent)),
          { persistent: true }
        );

        console.log(`📤 Published '${ORDER_CREATED_EVENT}' event to '${ORDER_EXCHANGE}'`);

        channel.ack(msg);
      } catch (error) {
        console.error('❌ Error processing message:', error);
        channel.nack(msg, false, true); // Requeue message
      }
    }
  });
};
