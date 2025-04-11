// src/gateway.ts
import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import amqp, { Channel } from 'amqplib';

const app = express();
const port = process.env.API_GATEWAY_SERVICE_PORT || 3000;

// RabbitMQ Config
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';
const QUEUE_NAME = process.env.ORDER_QUEUE || 'orderQueue';

let channel: Channel;

// Middleware
app.use(bodyParser.json());

// RabbitMQ connection setup
const connectRabbitMQ = async (): Promise<void> => {
  try {
    const connection = await amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
    channel = await connection.createChannel();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    console.log('✅ Connected to RabbitMQ');
  } catch (err) {
    console.error('❌ RabbitMQ connection failed:', err);
    process.exit(1);
  }
};

// POST /order route
app.post('/order', async (req: Request, res: Response): Promise<void> => {
  const orderData = req.body;

  if (!orderData.id || !orderData.customerName || !orderData.items) {
    res.status(400).json({ message: 'Invalid order data' });
    return;
  }

  try {
    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(orderData)), {
      persistent: true,
    });

    console.log('📦 Sent order to queue:', orderData.id);
    res.status(200).json({ message: 'Order created successfully!' });
  } catch (err) {
    console.error('❌ Failed to send order:', err);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Start app after RabbitMQ is ready
connectRabbitMQ().then(() => {
  app.listen(port, () => {
    console.log(`🚀 API Gateway running at http://localhost:${port}`);
  });
});
