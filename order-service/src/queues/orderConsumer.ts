// src/queues/orderConsumer.ts
import amqp from 'amqplib';
import { OrderModel } from '../models/order'; // Import the ORM model for saving to DB

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';
const QUEUE_NAME = process.env.ORDER_QUEUE || 'orderQueue';

async function connectToRabbitMQ() {
  try {
    const connection = await amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
    const channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    return channel;
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    process.exit(1);
  }
}

// Consume Orders from RabbitMQ and save to DB
export const consumeOrders = async () => {
  const channel = await connectToRabbitMQ();

  console.log(`[x] Waiting for messages in ${QUEUE_NAME}`);

  channel.consume(QUEUE_NAME, async (msg) => {
    if (msg !== null) {
      const order = JSON.parse(msg.content.toString());
      console.log('Order received from queue:', order);

      // Save the order to the database using Sequelize
      try {
        await OrderModel.create({
          id: order.id,
          customerName: order.customerName,
          items: order.items,
          total: order.total,
          status: order.status,
        });
        console.log('Order saved to database');

        // Acknowledge the message
        channel.ack(msg);
      } catch (error) {
        console.error('Error saving order to DB:', error);
        // Optionally, reject the message in case of failure
        channel.nack(msg, false, true);
      }
    }
  });
};
