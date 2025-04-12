import amqp from 'amqplib';

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';
const ORDER_QUEUE = process.env.ORDER_QUEUE || 'orderQueue';
const DLQ_QUEUE = process.env.DLQ_QUEUE || 'orderQueue_DLQ'; // Name of your DLQ

// Connect to RabbitMQ
export const connectToRabbitMQ = async () => {
  try {
    const connection = await amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
    const channel = await connection.createChannel();

    // Assert the order queue for consuming new orders
    await channel.assertQueue(ORDER_QUEUE, { durable: true });

    // Assert the DLQ for consuming failed orders
    await channel.assertQueue(DLQ_QUEUE, { durable: true });

    return channel;
  } catch (error) {
    console.error('❌ Failed to connect to RabbitMQ:', error);
    process.exit(1);
  }
};
