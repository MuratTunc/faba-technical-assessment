import express, { Request, Response, NextFunction } from 'express';
import bodyParser from 'body-parser';
import { Channel } from 'amqplib';
import { orderRoute } from './routes/routes';
import { connectRabbitMQ } from './services/rabbitmqService';
import logger from './utils/logger';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const port = process.env.API_GATEWAY_SERVICE_PORT || 3000;

// 🧩 Middleware: Log all incoming requests
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`📥 Incoming Request: ${req.method} ${req.url}`);

  if (Object.keys(req.body || {}).length > 0) {
    logger.info(`📦 Request Body: ${JSON.stringify(req.body)}`);
  }

  res.on('finish', () => {
    logger.info(`✅ Response Status: ${res.statusCode}`);
  });

  next();
});

// Middleware: Parse JSON
app.use(bodyParser.json());

// 📡 Connect to RabbitMQ and then initialize routes
connectRabbitMQ()
  .then((channel: Channel) => {
    app.use('/api', orderRoute(channel));

    // ❗ Error handler should be last after routes
    app.use(errorHandler);

    // 🚀 Start the server after setup
    app.listen(port, () => {
      logger.info(`🚀 API Gateway running at http://localhost:${port}`);
    });
  })
  .catch((err: Error) => {
    logger.error(`❌ Failed to start API Gateway: ${err.message}`);
    process.exit(1); // Exit process if RabbitMQ isn't connected
  });
