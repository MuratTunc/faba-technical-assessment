import * as amqp from 'amqplib';
import { config } from '../config';

let connection: amqp.Connection;
let channel: amqp.Channel;

export const initQueue = async () => {
  connection = await amqp.connect(config.rabbitmqUrl);
  channel = await connection.createChannel();

  await channel.assertQueue(config.orderQueue, {
    durable: true,
  });

  console.log('Order Queue connected');
};

export const sendToQueue = async (message: object) => {
  const messageBuffer = Buffer.from(JSON.stringify(message));
  channel.sendToQueue(config.orderQueue, messageBuffer, {
    persistent: true,
  });

  console.log('Message sent to queue:', message);
};
