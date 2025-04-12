import amqp from 'amqplib';
import logger from '../utils/logger';  // Import the logger utility

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';

const INVENTORY_QUEUE = process.env.INVENTORY_QUEUE || 'inventoryQueue';
const ORDER_EXCHANGE = 'order-events';
const INVENTORY_EXCHANGE = 'inventory-events';
const ORDER_CREATED_EVENT = 'order.created';

export async function connectToRabbitMQ() {
  try {
    logger.info(`🔗 Connecting to RabbitMQ at ${RABBITMQ_HOST}:${RABBITMQ_PORT}`);

    const connection = await amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
    const channel = await connection.createChannel();

    // Assert exchanges
    await channel.assertExchange(ORDER_EXCHANGE, 'topic', { durable: true });
    logger.info(`✅ Asserted exchange: ${ORDER_EXCHANGE}`);

    await channel.assertExchange(INVENTORY_EXCHANGE, 'topic', { durable: true });
    logger.info(`✅ Asserted exchange: ${INVENTORY_EXCHANGE}`);

    // Assert queue
    await channel.assertQueue(INVENTORY_QUEUE, { durable: true });
    logger.info(`✅ Asserted queue: ${INVENTORY_QUEUE}`);

    // Bind queue to order.created event from order-events exchange
    await channel.bindQueue(INVENTORY_QUEUE, ORDER_EXCHANGE, ORDER_CREATED_EVENT);
    logger.info(`🔗 Bound '${INVENTORY_QUEUE}' to '${ORDER_EXCHANGE}' with '${ORDER_CREATED_EVENT}'`);

    return channel;
  } catch (error) {
    logger.error('❌ Failed to connect to RabbitMQ:', error);
    process.exit(1);
  }
}
