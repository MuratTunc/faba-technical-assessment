import { connectToRabbitMQ } from '../services/rabbitmqService';
import { OrderModel } from '../models/order';
import logger from '../utils/logger';

const ORDER_QUEUE = process.env.ORDER_QUEUE || 'orderQueue';
const DLQ_QUEUE = process.env.DLQ_QUEUE || 'orderQueue_DLQ';
const CANCEL_QUEUE = process.env.ORDER_CANCEL_QUEUE || 'orderCancelQueue';
const CANCEL_DLQ = process.env.ORDER_CANCEL_DLQ || 'orderCancelQueue_DLQ';

const ORDER_EXCHANGE = 'order-events';
const ORDER_CREATED_EVENT = 'order.created';
const ORDER_CANCELLED_EVENT = 'order.cancelled';

// Versioning: Start with v1 for all events
const EVENT_VERSION = 'v1';

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
          item: order.item,
          total: order.total,
          status: order.status,
        });

        logger.info('💾 Order saved to database');

        // Publish the order created event with version info
        const orderCreatedEvent = {
          event: ORDER_CREATED_EVENT,
          version: EVENT_VERSION,
          data: savedOrder.toJSON(),
        };

        channel.publish(
          ORDER_EXCHANGE,
          ORDER_CREATED_EVENT,
          Buffer.from(JSON.stringify(orderCreatedEvent)),
          { persistent: true }
        );

        logger.info(`📤 Published '${ORDER_CREATED_EVENT}' event to '${ORDER_EXCHANGE}' with version ${EVENT_VERSION}`);
        channel.ack(msg);
      } catch (error) {
        logger.error('❌ Error processing message:', error);
        channel.nack(msg, false, true);
      }
    }
  });
};

export const consumeDLQ = async () => {
  const channel = await connectToRabbitMQ();

  logger.info(`[🟠] Waiting for messages in DLQ: ${DLQ_QUEUE}`);

  channel.consume(DLQ_QUEUE, async (msg) => {
    if (msg !== null) {
      try {
        const order = JSON.parse(msg.content.toString());
        logger.info('📩 Received order from DLQ:', order);

        const savedOrder = await OrderModel.create({
          id: order.id,
          customerName: order.customerName,
          item: order.item,
          total: order.total,
          status: order.status,
        });

        logger.info('💾 Order saved to database from DLQ');

        // Publish the order created event with version info
        const orderCreatedEvent = {
          event: ORDER_CREATED_EVENT,
          version: EVENT_VERSION,
          data: savedOrder.toJSON(),
        };

        channel.publish(
          ORDER_EXCHANGE,
          ORDER_CREATED_EVENT,
          Buffer.from(JSON.stringify(orderCreatedEvent)),
          { persistent: true }
        );

        logger.info(`📤 Published '${ORDER_CREATED_EVENT}' event to '${ORDER_EXCHANGE}' from DLQ with version ${EVENT_VERSION}`);
        channel.ack(msg);
      } catch (error) {
        logger.error('❌ Error processing DLQ message:', error);
        channel.nack(msg, false, true);
      }
    }
  });
};

export const consumeCancelOrders = async () => {
  const channel = await connectToRabbitMQ();

  logger.info(`[🛑] Waiting for messages in ${CANCEL_QUEUE}`);

  channel.consume(CANCEL_QUEUE, async (msg) => {
    if (msg !== null) {
      try {
        const cancelData = JSON.parse(msg.content.toString());
        logger.info(`📩 Received cancellation request:`, cancelData);

        // TODO: Add logic to update DB order status if needed
        // await OrderModel.update({ status: 'cancelled' }, { where: { id: cancelData.orderId } });

        // Publish the cancel event with version info
        const cancelEvent = {
          event: ORDER_CANCELLED_EVENT,
          version: EVENT_VERSION,
          data: cancelData,
        };

        channel.publish(
          ORDER_EXCHANGE,
          ORDER_CANCELLED_EVENT,
          Buffer.from(JSON.stringify(cancelEvent)),
          { persistent: true }
        );

        logger.info(`📤 Published '${ORDER_CANCELLED_EVENT}' event to '${ORDER_EXCHANGE}' with version ${EVENT_VERSION}`);
        channel.ack(msg);
      } catch (error) {
        logger.error('❌ Error processing cancellation message:', error);
        channel.nack(msg, false, true);
      }
    }
  });
};

export const consumeCancelDLQ = async () => {
  const channel = await connectToRabbitMQ();

  logger.info(`[🔴] Waiting for messages in DLQ: ${CANCEL_DLQ}`);

  channel.consume(CANCEL_DLQ, async (msg) => {
    if (msg !== null) {
      try {
        const cancelData = JSON.parse(msg.content.toString());
        logger.warn(`🚨 Received order cancel from DLQ:`, cancelData);

        // You may decide to store this or alert someone
        channel.ack(msg);
      } catch (error) {
        logger.error('❌ Error processing cancel DLQ message:', error);
        channel.nack(msg, false, true);
      }
    }
  });
};
