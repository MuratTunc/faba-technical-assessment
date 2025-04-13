// api-gateway/src/index.ts
import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import { Channel } from 'amqplib';
import { orderRoute } from './routes/routes';
import { connectRabbitMQ } from './services/rabbitmqService';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { logIncomingRequest } from './middleware/loggingMiddleware';  // Import logging middleware
import { gracefulShutdown } from './utils/gracefulShutdown';  // Import graceful shutdown

const app = express();
const port = process.env.API_GATEWAY_SERVICE_PORT || 3000;

// Middleware: Log all incoming requests
app.use(logIncomingRequest);

// Middleware: Parse JSON
app.use(bodyParser.json());

// Connect to RabbitMQ and then initialize routes
connectRabbitMQ()
  .then((channel: Channel) => {
    app.use('/api', orderRoute(channel));

    // ❗ Error handler should be last after routes
    app.use(errorHandler);

    // 🚀 Start the server after setup
    const server = app.listen(port, () => {
      logger.info(`🚀 API Gateway running at http://localhost:${port}`);
    });

    // Enable graceful shutdown and pass the channel for cleanup
    gracefulShutdown(server, channel);
  })
  .catch((err: Error) => {
    logger.error(`❌ Failed to start API Gateway: ${err.message}`);
    process.exit(1); // Exit process if RabbitMQ isn't connected
  });
