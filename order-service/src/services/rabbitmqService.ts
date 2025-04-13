import amqp from 'amqplib';
import logger from '../utils/logger';  // Import the logger utility

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';

const ORDER_QUEUE = process.env.ORDER_QUEUE || 'orderQueue';
const ORDER_DLQ = process.env.ORDER_DLQ || 'orderQueue_DLQ';

const CANCEL_QUEUE = process.env.ORDER_CANCEL_QUEUE || 'orderCancelQueue';
const CANCEL_DLQ = process.env.ORDER_CANCEL_DLQ || 'orderCancelQueue_DLQ';

export const connectToRabbitMQ = async () => {
  try {
    logger.info(`🔗 Connecting to RabbitMQ at ${RABBITMQ_HOST}:${RABBITMQ_PORT}`);

    const connection = await amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
    const channel = await connection.createChannel();

    // Assert queues for order creation
    await channel.assertQueue(ORDER_QUEUE, { durable: true });
    logger.info(`✅ Asserted queue: ${ORDER_QUEUE}`);

    await channel.assertQueue(ORDER_DLQ, { durable: true });
    logger.info(`✅ Asserted DLQ: ${ORDER_DLQ}`);

    // Assert queues for order cancellation
    await channel.assertQueue(CANCEL_QUEUE, { durable: true });
    logger.info(`✅ Asserted queue: ${CANCEL_QUEUE}`);

    await channel.assertQueue(CANCEL_DLQ, { durable: true });
    logger.info(`✅ Asserted DLQ: ${CANCEL_DLQ}`);

    return channel;
  } catch (error) {
    logger.error('❌ Failed to connect to RabbitMQ:', error);
    process.exit(1);
  }
};
