import { connectToRabbitMQ } from '../services/rabbitmqService';  // Import the function from rabbitmqService
import logger from '../utils/logger';

// Define the event names
const INVENTORY_STATUS_UPDATED_EVENT = 'inventory.status.updated';
const NOTIFICATION_SENT_EVENT = 'notification.sent';  // The event to be published by the notification service

const NOTIFICATION_QUEUE = process.env.NOTIFICATION_QUEUE || 'notificationQueue';  // The queue for notification events
const INVENTORY_EXCHANGE = 'inventory-events';  // Exchange for inventory events

// Connect to RabbitMQ and consume events
export const consumeInventoryStatusUpdated = async () => {
  const channel = await connectToRabbitMQ(NOTIFICATION_QUEUE, INVENTORY_EXCHANGE, INVENTORY_STATUS_UPDATED_EVENT); // Using the imported function

  logger.info(`Waiting for '${INVENTORY_STATUS_UPDATED_EVENT}' messages in '${NOTIFICATION_QUEUE}'`);

  channel.consume(NOTIFICATION_QUEUE, async (msg) => {
    if (msg !== null) {
      try {
        // Simply parse the incoming message to confirm we received it
        const event = JSON.parse(msg.content.toString());
        logger.info('📩 Received inventory.status.updated event:', event);

        // Prepare the notification event
        const notificationSentEvent = {
          event: NOTIFICATION_SENT_EVENT,  // The event name we will publish
          data: {
            message: `Inventory has been updated for order ${event.data.orderId}.`
          },
        };

        // Publish the notification.sent event
        channel.publish(
          INVENTORY_EXCHANGE,
          NOTIFICATION_SENT_EVENT,  // The routing key for notification events
          Buffer.from(JSON.stringify(notificationSentEvent)),
          { persistent: true }
        );

        logger.info(`📤 Published '${NOTIFICATION_SENT_EVENT}' event to '${INVENTORY_EXCHANGE}'`);

        // Acknowledge the message
        channel.ack(msg);
      } catch (error) {
        logger.error('❌ Error processing message:', error);
        // Nack the message and requeue in case of an error
        channel.nack(msg, false, true);
      }
    }
  });
};
