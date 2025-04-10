// src/gateway.ts
import express from 'express';
import bodyParser from 'body-parser';
import amqp from 'amqplib';

const app = express();
const port = process.env.PORT || 3000;

// RabbitMQ Configuration
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';
const QUEUE_NAME = process.env.ORDER_QUEUE || 'orderQueue';

// Middleware to parse JSON body
app.use(bodyParser.json());

// Connect to RabbitMQ
async function connectToRabbitMQ() {
  try {
    const connection = await amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
    return connection.createChannel();
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    process.exit(1); // Exit if RabbitMQ is not available
  }
}

// API Gateway Route to handle Order Creation
app.post('/order', async (req, res) => {
  try {
    const orderData = req.body;  // Get order data from the request body
    console.log('Received Order:', orderData);

    // Connect to RabbitMQ and send the order data to the queue
    const channel = await connectToRabbitMQ();
    await channel.assertQueue(QUEUE_NAME, { durable: true });
    channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(orderData)));

    res.status(200).json({ message: 'Order created successfully!' });
  } catch (error) {
    console.error('Error sending order to RabbitMQ:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Start the API Gateway server
app.listen(port, () => {
  console.log(`API Gateway running at http://localhost:${port}`);
});
