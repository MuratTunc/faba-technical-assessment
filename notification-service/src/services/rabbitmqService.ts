import amqp from 'amqplib';
import logger from '../utils/logger';  // Importing the logger

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';

export async function connectToRabbitMQ(queueName: string, exchangeName: string, eventName: string) {
  try {
    // Connect to RabbitMQ
    const connection = await amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
    const channel = await connection.createChannel();

    // Assert the queue and exchange
    await channel.assertQueue(queueName, { durable: true });
    await channel.assertExchange(exchangeName, 'topic', { durable: true });

    // Bind the queue to the specified event
    await channel.bindQueue(queueName, exchangeName, eventName);

    logger.info(`🔗 Bound '${queueName}' to '${exchangeName}' with '${eventName}'`);

    return channel;
  } catch (error) {
    logger.error('❌ Failed to connect to RabbitMQ:', error);
    process.exit(1);
  }
}
