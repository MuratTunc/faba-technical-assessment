import amqp from 'amqplib';
import logger from '../utils/logger';
import { CustomError } from '../utils/custom-error';

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';

export async function connectToRabbitMQ(queueName: string, exchangeName: string, eventName: string) {
  try {
    logger.info(`🔗 Connecting to RabbitMQ at ${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
    const connection = await amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
    const channel = await connection.createChannel();

    // Assert the queue and exchange
    await channel.assertQueue(queueName, { durable: true });
    await channel.assertExchange(exchangeName, 'topic', { durable: true });

    // Bind the queue to the specified event
    await channel.bindQueue(queueName, exchangeName, eventName);

    logger.info(`🔗 Bound '${queueName}' to '${exchangeName}' with '${eventName}'`);
    return channel;
  } catch (error: any) {
    logger.error('❌ Failed to connect to RabbitMQ:', error);
    // Throw a structured custom error instead of immediately exiting the process
    throw new CustomError(
      'RABBITMQ_CONNECTION_FAILED',
      'Failed to connect to RabbitMQ',
      500,
      { error: error.message }
    );
  }
}
