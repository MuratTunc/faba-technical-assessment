import amqp, { Channel } from 'amqplib';

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';
const QUEUE_NAME = process.env.ORDER_QUEUE || 'orderQueue';
const DLQ_NAME = process.env.ORDER_DLQ || 'orderQueue_DLQ'; // Dead Letter Queue name

export const connectRabbitMQ = async (retries = 5, delay = 5000): Promise<Channel> => {
  let attempt = 0;

  while (attempt < retries) {
    try {
      const connection = await amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
      const channel = await connection.createChannel();

      // Delete the queue if it already exists to reset parameters
      await channel.deleteQueue(QUEUE_NAME, { ifUnused: false, ifEmpty: false });

      // Define Dead Letter Queue
      await channel.assertQueue(DLQ_NAME, { durable: true });

      // Declare main queue with Dead Letter Exchange (DLX) mechanism and TTL
      await channel.assertQueue(QUEUE_NAME, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',  // No additional exchange for DLQ
          'x-dead-letter-routing-key': DLQ_NAME, // Messages go to the DLQ
          'x-message-ttl': 60000, // Message TTL in milliseconds, after which it will be dead-lettered
        },
      });

      console.log('✅ Connected to RabbitMQ with DLQ setup');
      return channel;
    } catch (err) {
      attempt++;
      const isLastAttempt = attempt === retries;
      const retryDelay = delay + Math.floor(Math.random() * 1000); // Add jitter
      console.error(`❌ RabbitMQ connection failed (attempt ${attempt}/${retries}):`, err);

      if (!isLastAttempt) {
        console.log(`Retrying in ${retryDelay / 1000} seconds...`);
        await new Promise((res) => setTimeout(res, retryDelay));
        delay *= 2; // Exponential backoff
      } else {
        console.error('❌ Failed to connect to RabbitMQ after several attempts.');
        process.exit(1); // Exit after final attempt
      }
    }
  }

  // Just to satisfy TypeScript
  throw new Error('Unreachable');
};
