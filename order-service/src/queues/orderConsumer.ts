import { connectToRabbitMQ } from '../services/rabbitmqService'; // Import from the new service file
import { OrderModel } from '../models/order';
import logger from '../utils/logger'; // Import the logger utility

const ORDER_QUEUE = process.env.ORDER_QUEUE || 'orderQueue';
const DLQ_QUEUE = process.env.DLQ_QUEUE || 'orderQueue_DLQ';  // Define the DLQ queue name
const ORDER_EXCHANGE = 'order-events';
const ORDER_CREATED_EVENT = 'order.created';

// Consume the normal order queue
export const consumeOrders = async () => {
  const channel = await connectToRabbitMQ();

  logger.info(`[🟢] Waiting for messages in ${ORDER_QUEUE}`);

  channel.consume(ORDER_QUEUE, async (msg) => {
    if (msg !== null) {
      try {
        const order = JSON.parse(msg.content.toString());
        logger.info('📩 Received order:', order);

        const savedOrder = await OrderModel.create({
          id: order.id,
          customerName: order.customerName,
          items: order.items,
          total: order.total,
          status: order.status,
        });

        logger.info('💾 Order saved to database');

        const orderCreatedEvent = {
          event: ORDER_CREATED_EVENT,
          data: savedOrder.toJSON(),
        };

        // Publish to the exchange with routing key 'order.created'
        channel.publish(
          ORDER_EXCHANGE,
          ORDER_CREATED_EVENT,
          Buffer.from(JSON.stringify(orderCreatedEvent)),
          { persistent: true }
        );

        logger.info(`📤 Published '${ORDER_CREATED_EVENT}' event to '${ORDER_EXCHANGE}'`);

        channel.ack(msg);
      } catch (error) {
        logger.error('❌ Error processing message:', error);
        channel.nack(msg, false, true); // Requeue message
      }
    }
  });
};

// Consume messages from the DLQ (Dead Letter Queue)

export const consumeDLQ = async () => {
  const channel = await connectToRabbitMQ();

  logger.info(`[🟠] Waiting for messages in DLQ: ${DLQ_QUEUE}`);

  channel.consume(DLQ_QUEUE, async (msg) => {
    if (msg !== null) {
      try {
        const order = JSON.parse(msg.content.toString());
        logger.info('📩 Received order from DLQ:', order);

        // Handle order processing here like in consumeOrders
        const savedOrder = await OrderModel.create({
          id: order.id,
          customerName: order.customerName,
          items: order.items,
          total: order.total,
          status: order.status,
        });

        logger.info('💾 Order saved to database from DLQ');

        const orderCreatedEvent = {
          event: ORDER_CREATED_EVENT,
          data: savedOrder.toJSON(),
        };

        // Publish to the exchange with routing key 'order.created'
        channel.publish(
          ORDER_EXCHANGE,
          ORDER_CREATED_EVENT,
          Buffer.from(JSON.stringify(orderCreatedEvent)),
          { persistent: true }
        );

        logger.info(`📤 Published '${ORDER_CREATED_EVENT}' event to '${ORDER_EXCHANGE}' from DLQ`);

        channel.ack(msg);
      } catch (error) {
        logger.error('❌ Error processing DLQ message:', error);
        channel.nack(msg, false, true); // Requeue message or handle failure differently
      }
    }
  });
};
