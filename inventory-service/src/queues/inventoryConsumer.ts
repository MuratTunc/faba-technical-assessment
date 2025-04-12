import amqp from 'amqplib';

// Define an interface for the item structure
interface OrderItem {
  productId: string;  // Assuming productId is a string, change type if needed
  quantity: number;   // Assuming quantity is a number, change type if needed
}

const RABBITMQ_HOST = process.env.RABBITMQ_HOST || 'rabbitmq';
const RABBITMQ_PORT = process.env.RABBITMQ_PORT || '5672';
const INVENTORY_QUEUE = process.env.INVENTORY_QUEUE || 'inventoryQueue';  // Updated to correct queue name
const INVENTORY_EXCHANGE = 'inventory-events';
const ORDER_EXCHANGE = 'order-events';
const ORDER_CREATED_EVENT = 'order.created';
const INVENTORY_STATUS_UPDATED_EVENT = 'inventory.status.updated'; // Updated event name

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

        // Prepare and publish the inventory status update event
        const inventoryStatusUpdatedEvent = {
          event: INVENTORY_STATUS_UPDATED_EVENT, // Changed to 'inventory.status.updated'
          data: {
            orderId: order.id,
            // You can still include the items in the updated event if needed
            updatedItems: order.items.map((item: OrderItem) => ({  // Type the 'item' parameter
              productId: item.productId,
              deducted: item.quantity,
            })),
          },
        };

        // Publish to the inventory-events exchange
        channel.publish(
          INVENTORY_EXCHANGE,
          INVENTORY_STATUS_UPDATED_EVENT, // Updated event name
          Buffer.from(JSON.stringify(inventoryStatusUpdatedEvent)),
          { persistent: true }
        );

        console.log(`📤 Published '${INVENTORY_STATUS_UPDATED_EVENT}' event to '${INVENTORY_EXCHANGE}'`);

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
