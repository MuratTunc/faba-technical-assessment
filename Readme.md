## Correct Flow Summary:

### 1. Client sends a POST request to the API Gateway:
- The client sends an order request (with data like items, customer name, etc.) to the API Gateway endpoint (`/order`).

### 2. API Gateway receives the order data:
- The API Gateway handles the incoming POST request and receives the order data in the request body.

### 3. API Gateway sends the order data as a message to RabbitMQ:
- The API Gateway processes the order data and sends it to RabbitMQ using `amqplib`. The order data is sent as a message to the `orderQueue`.

### 4. OrderService consumes the message from the RabbitMQ queue:
- The `order-service` listens to the `orderQueue` and consumes the order message.

### 5. OrderService saves the order to the database:
- After consuming the message, the `order-service` saves the order data to the PostgreSQL database (order-db) using an ORM (e.g., Sequelize or TypeORM).

### 6. OrderService processes the order and optionally publishes an `order.created` event to RabbitMQ for other services to consume:
- After saving the order to the database, the `order-service` can publish an `order.created` event to another RabbitMQ queue. Other services (e.g., inventory service, notification service) can consume this event to perform their tasks.



### Send a POST request to the API Gateway to create an order

Use the following `curl` command to send a request to the API Gateway for creating an order:

```bash
curl -X POST http://localhost:3000/order \
  -H "Content-Type: application/json" \
  -d '{
        "customerName": "Faba Best",
        "items": ["item1", "item2"],
        "total": 99.99,
        "status": "pending"
      }'
