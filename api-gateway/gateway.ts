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

// *****Retry mechanism for RabbitMQ connection********
const connectRabbitMQ = async (retries: number = 5, delay: number = 5000): Promise<void> => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const connection = await amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
      channel = await connection.createChannel();
      await channel.assertQueue(QUEUE_NAME, { durable: true });
      console.log('✅ Connected to RabbitMQ');
      return; // Successfully connected, exit the loop...
    } catch (err) {
      attempt++;
      console.error(`❌ RabbitMQ connection failed (attempt ${attempt}):`, err);
      if (attempt < retries) {
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay)); // Wait before retry
        delay *= 2; // Exponential backoff (increases delay on each retry)
      } else {
        console.error('❌ Failed to connect to RabbitMQ after several attempts.');
        // Graceful Failure-->
        process.exit(1); // Exit the process if unable to connect after all retries
      }
    }
  }
};

// POST /order route
app.post('/order', async (req: Request, res: Response): Promise<void> => {
  const { customerName, items, total, status } = req.body;

  // Validate the necessary fields
  if (!customerName || !items || !total || !status) {
    res.status(400).json({ message: 'Invalid order data' });
    return;
  }

  const orderData = {
    id: `${Date.now()}`, // Generate a simple order ID based on timestamp
    customerName,
    items,
    total,
    status,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  try {
    // Send order to RabbitMQ queue
    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(orderData)), {
      persistent: true, // Ensures message is saved to disk
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
