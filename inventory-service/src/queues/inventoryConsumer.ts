// src/queues/inventoryConsumer.ts

import amqp from 'amqplib';
import { InventoryModel } from '../models/inventory'; // Adjust model import as needed

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';
const INVENTORY_QUEUE = process.env.INVENTORY_QUEUE || 'inventoryQueue';  // Updated to correct queue name
const INVENTORY_EXCHANGE = 'inventory-events';
const ORDER_EXCHANGE = 'order-events';
const ORDER_CREATED_EVENT = 'order.created';
const INVENTORY_UPDATED_EVENT = 'inventory.updated';

async function connectToRabbitMQ() {
  try {
    const connection = await amqp.connect(`amqp://${RABBITMQ_HOST}:${RABBITMQ_PORT}`);
    const channel = await connection.createChannel();

    // Ensure both exchanges and the queue are created
    await channel.assertQueue(INVENTORY_QUEUE, { durable: true });
    await channel.assertExchange(ORDER_EXCHANGE, 'topic', { durable: true });
    await channel.assertExchange(INVENTORY_EXCHANGE, 'topic', { durable: true });

    // Bind the queue to the order.created event from the order exchange
    await channel.bindQueue(INVENTORY_QUEUE, ORDER_EXCHANGE, ORDER_CREATED_EVENT);

    return channel;
  } catch (error) {
    console.error('❌ Failed to connect to RabbitMQ:', error);
    process.exit(1);
  }
}

export const consumeOrderCreated = async () => {
  const channel = await connectToRabbitMQ();

  console.log(`[🟢] Waiting for '${ORDER_CREATED_EVENT}' messages in '${INVENTORY_QUEUE}'`);

  channel.consume(INVENTORY_QUEUE, async (msg) => {
    if (msg !== null) {
      try {
        // Parse the incoming message
        const event = JSON.parse(msg.content.toString());
        const order = event.data;
        console.log('📩 Received order.created event:', order);

        // To track the updated items
        const updatedItems: any[] = [];

        for (const item of order.items) {
          // Update inventory here - decrement the quantity
          await InventoryModel.decrement('quantity', {
            by: item.quantity,
            where: { id: item.productId },  // Ensure correct field for matching
          });

          // Add the updated item details
          updatedItems.push({
            productId: item.productId,
            deducted: item.quantity,
          });
        }

        console.log('💾 Inventory updated in database');

        // Prepare and publish the inventory update event
        const inventoryUpdatedEvent = {
          event: INVENTORY_UPDATED_EVENT,
          data: {
            orderId: order.id,
            updatedItems,
          },
        };

        // Publish to the inventory-events exchange
        channel.publish(
          INVENTORY_EXCHANGE,
          INVENTORY_UPDATED_EVENT,
          Buffer.from(JSON.stringify(inventoryUpdatedEvent)),
          { persistent: true }
        );

        console.log(`📤 Published '${INVENTORY_UPDATED_EVENT}' event to '${INVENTORY_EXCHANGE}'`);

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
