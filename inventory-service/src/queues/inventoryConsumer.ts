import { connectToRabbitMQ } from '../services/rabbitmqService';
import logger from '../utils/logger';
import { CustomError } from '../utils/custom-error'; // Import your custom error class

const INVENTORY_QUEUE = process.env.INVENTORY_QUEUE || 'inventoryQueue';
const INVENTORY_EXCHANGE = 'inventory-events';
const ORDER_CREATED_EVENT = 'order.created';
const INVENTORY_STATUS_UPDATED_EVENT = 'inventory.status.updated';

export const consumeOrderCreated = async () => {
  const channel = await connectToRabbitMQ();

  logger.info(`📦 Waiting for '${ORDER_CREATED_EVENT}' messages in '${INVENTORY_QUEUE}'`);

  channel.consume(INVENTORY_QUEUE, async (msg) => {
    if (msg !== null) {
      try {
        const event = JSON.parse(msg.content.toString());
        const order = event.data;

        if (!order?.id) {
          throw new CustomError(
            'INVALID_ORDER_DATA',
            'Order ID is missing in the event payload',
            400,
            { payload: event }
          );
        }

        logger.info('📩 Received order.created event:', order);

        const inventoryStatusUpdatedEvent = {
          event: INVENTORY_STATUS_UPDATED_EVENT,
          data: {
            orderId: order.id,
            message: `Inventory checked or placeholder update for order ${order.id}.`,
          },
        };

        channel.publish(
          INVENTORY_EXCHANGE,
          INVENTORY_STATUS_UPDATED_EVENT,
          Buffer.from(JSON.stringify(inventoryStatusUpdatedEvent)),
          { persistent: true }
        );

        logger.info(`📤 Published '${INVENTORY_STATUS_UPDATED_EVENT}' event to '${INVENTORY_EXCHANGE}'`);

        channel.ack(msg);
      } catch (error: any) {
        if (error instanceof CustomError) {
          logger.error(`❌ CustomError [${error.code}]: ${error.message}`, {
            details: error.details,
            statusCode: error.statusCode
          });
        } else {
          logger.error('❌ Unhandled error:', error);
        }

        channel.nack(msg, false, true); // Requeue the message
      }
    }
  });
};
