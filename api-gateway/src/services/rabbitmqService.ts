// api-gateway/src/services/rabbitmqService.ts
import amqp, { Channel } from 'amqplib';

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';
const QUEUE_NAME = process.env.ORDER_QUEUE || 'orderQueue';

export const connectRabbitMQ = async (retries = 5, delay = 5000): Promise<Channel> => {
  let attempt = 0;

  while (attempt < retries) {
    try {
      const connection = await amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
      const channel = await connection.createChannel();
      await channel.assertQueue(QUEUE_NAME, { durable: true });
      console.log('✅ Connected to RabbitMQ');
      return channel;
    } catch (err) {
      attempt++;
      console.error(`❌ RabbitMQ connection failed (attempt ${attempt}):`, err);
      if (attempt < retries) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((res) => setTimeout(res, delay));
        delay *= 2;
      } else {
        console.error('❌ Failed to connect to RabbitMQ after several attempts.');
        process.exit(1);
      }
    }
  }

  // just to satisfy TS
  throw new Error('Unreachable');
};
