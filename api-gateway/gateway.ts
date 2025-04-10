import express from 'express';
import bodyParser from 'body-parser';
import axios from 'axios';

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON body
app.use(bodyParser.json());

// API Gateway Route to handle Order Creation
app.post('/order', async (req, res) => {
  try {
    const orderData = req.body;  // Get order data from the request body
    console.log('Received Order:', orderData);

    // Send this order data to RabbitMQ (we'll implement this later)
    // For now, simulate sending data to the order service
    await axios.post('http://order-service:3001/orders', orderData);

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
