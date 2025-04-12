import amqp from 'amqplib';
import logger from '../utils/logger';  // Import the logger utility

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';
const ORDER_QUEUE = process.env.ORDER_QUEUE || 'orderQueue';
const DLQ_QUEUE = process.env.DLQ_QUEUE || 'orderQueue_DLQ';

// Connect to RabbitMQ
export const connectToRabbitMQ = async () => {
  try {
    logger.info(`🔗 Connecting to RabbitMQ at ${RABBITMQ_HOST}:${RABBITMQ_PORT}`);

    const connection = await amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
    const channel = await connection.createChannel();

    // Assert the order queue for consuming new orders
    await channel.assertQueue(ORDER_QUEUE, { durable: true });
    logger.info(`✅ Asserted queue: ${ORDER_QUEUE}`);

    // Assert the DLQ for consuming failed orders
    await channel.assertQueue(DLQ_QUEUE, { durable: true });
    logger.info(`✅ Asserted queue: ${DLQ_QUEUE}`);

    return channel;
  } catch (error) {
    logger.error('❌ Failed to connect to RabbitMQ:', error);
    process.exit(1);
  }
};
