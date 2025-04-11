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

# Function to show database content (optional)
show_database_table() {
  CONTAINER_ID=$(docker ps -qf "name=$ORDER_POSTGRES_DB_CONTAINER_NAME")

  if [ -z "$CONTAINER_ID" ]; then
      echo "❌ No running container found with name '$USER_POSTGRES_DB_CONTAINER_NAME'."
      exit 1
  fi

  docker exec -i "$CONTAINER_ID" psql -U "$ORDER_POSTGRES_DB_USER" -d "$ORDER_POSTGRES_DB_NAME" -c "SELECT * FROM orders;"
}

### 🚀 Send test order to /order endpoint
echo "📤 Sending test order to /order endpoint..."

RESPONSE=$(curl -s -X POST http://localhost:3000/order \
  -H "Content-Type: application/json" \
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

# Optional DB check

show_database_table

echo -e "\n✅✅✅ ALL TESTS ARE DONE!!! ✅✅✅"

