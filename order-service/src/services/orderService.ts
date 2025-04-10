// src/services/orderService.ts
import amqp from 'amqplib';
import { v4 as uuidv4 } from 'uuid';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
const ORDER_QUEUE = 'order.create';
const ORDER_CREATED_EVENT = 'order.created';

export const startOrderService = async () => {
  try {
    const connection = await amqp.connect(RABBITMQ_URL);
    const channel = await connection.createChannel();

    // Assert the queue for consuming orders
    await channel.assertQueue(ORDER_QUEUE, { durable: true });

    console.log(`[*] Waiting for messages in ${ORDER_QUEUE}`);

    channel.consume(ORDER_QUEUE, async (msg) => {
      if (msg) {
        const orderData = JSON.parse(msg.content.toString());
        console.log('[>] Received new order:', orderData);

        // Simulate storing the order in a DB
        const savedOrder = {
          id: uuidv4(),
          ...orderData,
          createdAt: new Date().toISOString(),
        };

        console.log('[✔] Order saved:', savedOrder);

        // Emit `order.created` event
        const orderCreatedEvent = {
          event: ORDER_CREATED_EVENT,
          data: savedOrder,
        };

        // Publish event
        channel.publish(
          '',
          ORDER_CREATED_EVENT,
          Buffer.from(JSON.stringify(orderCreatedEvent)),
          { persistent: true }
        );

        console.log(`[🔥] Published ${ORDER_CREATED_EVENT} event`);

        // Acknowledge the message
        channel.ack(msg);
      }
    });
  } catch (error) {
    console.error('[x] Failed to start order service:', error);
    process.exit(1);
  }
};
