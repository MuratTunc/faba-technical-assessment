import express from 'express';
import bodyParser from 'body-parser';
import { Channel } from 'amqplib';
import { orderRoute } from './routes/routes';
import { connectRabbitMQ } from './services/rabbitmqService';

const app = express();
const port = process.env.API_GATEWAY_SERVICE_PORT || 3000;

app.use(bodyParser.json());

connectRabbitMQ().then((channel: Channel) => {
  app.use('/api', orderRoute(channel));

  app.listen(port, () => {
    console.log(`🚀 API Gateway running at http://localhost:${port}`);
  });
});
