#!/bin/bash

# Load environment variables from .env file
ENV_FILE="../build-tools/.env"
if [ -f "$ENV_FILE" ]; then
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo "⚠️ .env file not found at $ENV_FILE"
  exit 1
fi

# Install jq (JSON parsing utility) if not already installed
if ! command -v jq &> /dev/null
then
  echo "jq could not be found, installing..."
  sudo apt-get update
  sudo apt-get install -y jq
fi

echo -e "********************************************************************"
echo -e "✅✅✅ $ORDER_SERVICE INTEGRATION TESTS START..."
echo -e "********************************************************************"

# Function to show order database content (optional)
show-order-db-database-table() {
  CONTAINER_ID=$(docker ps -qf "name=$ORDER_POSTGRES_DB_CONTAINER_NAME")

  if [ -z "$CONTAINER_ID" ]; then
      echo "❌ No running container found with name '$USER_POSTGRES_DB_CONTAINER_NAME'."
      exit 1
  fi

  docker exec -i "$CONTAINER_ID" psql -U "$ORDER_POSTGRES_DB_USER" -d "$ORDER_POSTGRES_DB_NAME" -c "SELECT * FROM orders;"
}

# Function to list all running Docker containers
list-running-containers() {
  echo "📜 Listing all running containers..."

  docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
}

### 🚀 Send test order to /order endpoint
echo "📤 Sending test order to /order endpoint..."

# Generate a unique Idempotency Key (can use a UUID or timestamp)
IDEMPOTENCY_KEY=$(date +%s%N)  # Unique key based on timestamp (nanoseconds)

RESPONSE=$(curl -s -X POST http://localhost:3000/api/order \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $IDEMPOTENCY_KEY" \
  -d '{
        "customerName": "Faba Best Company",
        "items": ["item1", "item2"],
        "total": 99.99,
        "status": "pending"
      }')

echo "🔍 Raw response: $RESPONSE"

# Parse message from JSON
MESSAGE=$(echo "$RESPONSE" | jq -r '.message')

if [ "$MESSAGE" == "Order created successfully!" ]; then
  echo "✅ Order creation response is correct!"
else
  echo "❌ Unexpected response: $MESSAGE"
  exit 1
fi

# Optional DB check for order DB
show-order-db-database-table

# List all running containers
list-running-containers

echo -e "\n✅✅✅ ALL TESTS ARE DONE!!! ✅✅✅"