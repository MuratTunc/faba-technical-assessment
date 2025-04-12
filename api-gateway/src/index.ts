// src/index.ts

import express from 'express';
import bodyParser from 'body-parser';
import { Channel } from 'amqplib';
import { orderRoute } from './routes/routes';
import { connectRabbitMQ } from './services/rabbitmqService';
import logger from './utils/logger';

const app = express();
const port = process.env.API_GATEWAY_SERVICE_PORT || 3000;

// Middleware to log requests
app.use((req, res, next) => {
  const { method, url } = req;
  logger.info(`Incoming Request: ${method} ${url}`);

  // Log the request body if necessary
  if (req.body) {
    logger.info(`Request Body: ${JSON.stringify(req.body)}`);
  }

  res.on('finish', () => {
    // Log the response status code once the request is processed
    logger.info(`Response Status: ${res.statusCode}`);
  });

  next(); // Pass control to the next middleware or route handler
});

// Parse JSON request bodies
app.use(bodyParser.json());

// Connect to RabbitMQ and set up routes
connectRabbitMQ().then((channel: Channel) => {
  // Use the channel for handling routes related to orders
  app.use('/api', orderRoute(channel));

  // Start the server
  app.listen(port, () => {
    logger.info(`🚀 API Gateway running at http://localhost:${port}`);
  });
});

// Error handling middleware (with TypeScript error type)
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error(`Error occurred: ${err.message}`);
  res.status(500).send('Internal Server Error');
});
