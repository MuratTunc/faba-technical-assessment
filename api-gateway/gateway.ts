import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 3000;

// RabbitMQ Configuration
const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';  // Default to 'rabbitmq' if not defined
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';      // Default to port '5672'

// Middleware to parse JSON body
app.use(bodyParser.json());

// API Gateway Route to handle Order Creation
app.post('/order', async (req, res) => {
  try {
    const orderData = req.body;  // Get order data from the request body
    console.log('Received Order:', orderData);

    // Send this order data to RabbitMQ
    const rabbitmqUrl = `http://${RABBITMQ_HOST}:${RABBITMQ_PORT}/orders`;
    console.log(`Sending order data to RabbitMQ at ${rabbitmqUrl}`);

    await axios.post(rabbitmqUrl, orderData);  // Send to RabbitMQ

    res.status(200).json({ message: 'Order created successfully!' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Failed to create order' });
  }
});

// Start the API Gateway server
app.listen(port, () => {
  console.log(`API Gateway running at http://localhost:${port}`);
});
