import { connectToRabbitMQ } from '../services/rabbitmqService';  // Import the RabbitMQ connection function
import logger from '../utils/logger';                              // Import the logger utility
import { CustomError } from '../utils/custom-error';              // Import the CustomError class

// Define the event names
const INVENTORY_STATUS_UPDATED_EVENT = 'inventory.status.updated';
const NOTIFICATION_SENT_EVENT = 'notification.sent';  // The event to be published by the notification service

const NOTIFICATION_QUEUE = process.env.NOTIFICATION_QUEUE || 'notificationQueue';  // The queue for notification events
const INVENTORY_EXCHANGE = 'inventory-events';  // Exchange for inventory events

export const consumeInventoryStatusUpdated = async () => {
  // Connect to RabbitMQ and bind the queue to listen for inventory.status.updated events
  const channel = await connectToRabbitMQ(NOTIFICATION_QUEUE, INVENTORY_EXCHANGE, INVENTORY_STATUS_UPDATED_EVENT);

  logger.info(`Waiting for '${INVENTORY_STATUS_UPDATED_EVENT}' messages in '${NOTIFICATION_QUEUE}'`);

  channel.consume(NOTIFICATION_QUEUE, async (msg) => {
    if (msg !== null) {
      try {
        // Parse the incoming message
        const event = JSON.parse(msg.content.toString());
        logger.info('📩 Received inventory.status.updated event:', event);

        // Prepare the notification.sent event payload
        const notificationSentEvent = {
          event: NOTIFICATION_SENT_EVENT,
          data: {
            message: `Inventory has been updated for order ${event.data.orderId}.`
          },
        };

        // Publish the notification.sent event to the inventory-events exchange
        channel.publish(
          INVENTORY_EXCHANGE,
          NOTIFICATION_SENT_EVENT,
          Buffer.from(JSON.stringify(notificationSentEvent)),
          { persistent: true }
        );

        logger.info(`📤 Published '${NOTIFICATION_SENT_EVENT}' event to '${INVENTORY_EXCHANGE}'`);

        // Acknowledge the message
        channel.ack(msg);
      } catch (error) {
        // Wrap the error in a CustomError for structured error handling
        const customError = new CustomError(
          'NOTIFICATION_PROCESSING_ERROR',
          'Error processing inventory status update message',
          500,
          { originalError: error }
        );
        logger.error(`❌ ${customError.message}`, customError.details);
        // Negative acknowledgment: requeue the message for further processing
        channel.nack(msg, false, true);
      }
    }
  });
};
