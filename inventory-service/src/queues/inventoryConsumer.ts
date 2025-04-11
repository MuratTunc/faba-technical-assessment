import amqp from 'amqplib';
import { InventoryModel } from '../models/inventory'

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';
const INVENTORY_QUEUE = process.env.INVENTORY_QUEUE || 'inventoryQueue';
const ORDER_CREATED_EVENT = 'order.created';
const ITEM_DECREASE_EVENT = 'item.decreased';

async function connectToRabbitMQ() {
  try {
    const connection = await amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
    const channel = await connection.createChannel();

    // Assert the event queue for 'order.created' event
    await channel.assertQueue(ORDER_CREATED_EVENT, { durable: true });

    // Assert the queue for 'item.decreased' event
    await channel.assertQueue(ITEM_DECREASE_EVENT, { durable: true });

    return { connection, channel };
  } catch (error) {
    console.error('❌ Failed to connect to RabbitMQ:', error);
    process.exit(1); // consider adding retry logic here
  }
}

export const consumeOrderCreatedEvent = async () => {
  const { connection, channel } = await connectToRabbitMQ();

  console.log(`[🟢] Waiting for ${ORDER_CREATED_EVENT} events`);

  channel.consume(ORDER_CREATED_EVENT, async (msg) => {
    if (msg !== null) {
      try {
        const orderData = JSON.parse(msg.content.toString());
        console.log('[📩] Received order:', orderData);

        // Loop through the items in the order to update inventory
        for (const item of orderData.data.items) {
          const inventoryItem = await InventoryModel.findOne({
            where: { itemName: item },
          });

          if (inventoryItem) {
            // Decrease the inventory quantity
            inventoryItem.quantity -= 1;
            await inventoryItem.save();

            console.log(`[💾] Inventory updated for item: ${item}`);

            // Publish item decrease event
            const itemDecreasedEvent = {
              event: ITEM_DECREASE_EVENT,
              data: {
                itemName: item,
                newQuantity: inventoryItem.quantity,
              },
            };

            channel.sendToQueue(
              ITEM_DECREASE_EVENT,
              Buffer.from(JSON.stringify(itemDecreasedEvent)),
              { persistent: true }
            );

            console.log(`[📤] Published ${ITEM_DECREASE_EVENT} for ${item}`);
          } else {
            console.log(`[❌] Inventory item not found for: ${item}`);
          }
        }

        // Acknowledge the message
        channel.ack(msg);
      } catch (error) {
        console.error('❌ Error processing order created event:', error);
        channel.nack(msg, false, true); // requeue the message with a delay if necessary
      }
    }
  });

  // Graceful shutdown of RabbitMQ connection and channel
  const gracefulShutdown = async () => {
    console.log('🛑 Gracefully shutting down...');
    await channel.close();
    await connection.close();
    console.log('✅ RabbitMQ connection closed');
    process.exit(0);
  };

  process.on('SIGINT', gracefulShutdown);
  process.on('SIGTERM', gracefulShutdown);
};

// Call the function to start listening for events
consumeOrderCreatedEvent();
