import amqp from 'amqplib';

// Define the event names
const INVENTORY_STATUS_UPDATED_EVENT = 'inventory.status.updated';
const NOTIFICATION_SENT_EVENT = 'notification.sent';  // The event to be published by the notification service

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';
const NOTIFICATION_QUEUE = process.env.NOTIFICATION_QUEUE || 'notificationQueue';  // The queue for notification events
const INVENTORY_EXCHANGE = 'inventory-events';  // Exchange for inventory events

// Connect to RabbitMQ
async function connectToRabbitMQ() {
  try {
    const connection = await amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
    const channel = await connection.createChannel();

    // Ensure the notification queue and exchanges are created
    await channel.assertQueue(NOTIFICATION_QUEUE, { durable: true });
    await channel.assertExchange(INVENTORY_EXCHANGE, 'topic', { durable: true });

    // Bind the queue to the 'inventory.status.updated' event
    await channel.bindQueue(NOTIFICATION_QUEUE, INVENTORY_EXCHANGE, INVENTORY_STATUS_UPDATED_EVENT);

    return channel;
  } catch (error) {
    console.error('❌ Failed to connect to RabbitMQ:', error);
    process.exit(1);
  }
}

// Consume the 'inventory.status.updated' event and publish 'notification.sent' event
export const consumeInventoryStatusUpdated = async () => {
  const channel = await connectToRabbitMQ();

  console.log(`[🟢] Waiting for '${INVENTORY_STATUS_UPDATED_EVENT}' messages in '${NOTIFICATION_QUEUE}'`);

  channel.consume(NOTIFICATION_QUEUE, async (msg) => {
    if (msg !== null) {
      try {
        // Parse the incoming message
        const event = JSON.parse(msg.content.toString());
        const inventoryUpdate = event.data;
        console.log('📩 Received inventory.status.updated event:', inventoryUpdate);

        // Prepare the notification event
        const notificationSentEvent = {
          event: NOTIFICATION_SENT_EVENT,  // The event name we will publish
          data: {
            orderId: inventoryUpdate.orderId,
            updatedItems: inventoryUpdate.updatedItems,
            message: `Inventory has been updated for order ${inventoryUpdate.orderId}.`
          },
        };

        // Publish the notification.sent event
        channel.publish(
          INVENTORY_EXCHANGE,
          NOTIFICATION_SENT_EVENT,  // The routing key for notification events
          Buffer.from(JSON.stringify(notificationSentEvent)),
          { persistent: true }
        );

        console.log(`📤 Published '${NOTIFICATION_SENT_EVENT}' event to '${INVENTORY_EXCHANGE}'`);

        // Acknowledge the message
        channel.ack(msg);
      } catch (error) {
        console.error('❌ Error processing message:', error);
        // Nack the message and requeue in case of an error
        channel.nack(msg, false, true);
      }
    }
  });
};
