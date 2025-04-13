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
      echo "❌ No running container found with name '$ORDER_POSTGRES_DB_CONTAINER_NAME'."
      exit 1
  fi
  docker exec -i "$CONTAINER_ID" psql -U "$ORDER_POSTGRES_DB_USER" -d "$ORDER_POSTGRES_DB_NAME" -c "SELECT * FROM orders;"
}

# Function to list all running Docker containers and show logs
list-running-containers() {
  echo "📜 Listing all running containers and showing logs..."
  
  # Get the names of all running containers
  CONTAINER_NAMES=$(docker ps --format "{{.Names}}")
  
  # Loop through each container name and fetch logs
  for CONTAINER_NAME in $CONTAINER_NAMES; do
    echo -e "\n\033[32m📝 Logs for container: $CONTAINER_NAME\033[0m"  # Prints in green
    docker logs "$CONTAINER_NAME"
  done
}

# Function to send a POST request to the /order-created endpoint
send_post_request() {
  local url=$1
  local idempotency_key=$2
  local payload=$3
  
  echo "📤 Sending test order to $url endpoint..."
  
  RESPONSE=$(curl -s -X POST "$url" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: $idempotency_key" \
    -d "$payload")
  
  echo "🔍 Raw response: $RESPONSE"
  
  # Parse message from JSON
  MESSAGE=$(echo "$RESPONSE" | jq -r '.message')
  
  if [ "$MESSAGE" == "Order created successfully!" ]; then
    echo "✅ Order creation response is correct!"
  else
    echo "❌ Unexpected response: $MESSAGE"
    exit 1
  fi
}

### 🚀 Test Order Creation

# Generate a unique Idempotency Key (using nanosecond timestamp)
IDEMPOTENCY_KEY=$(date +%s%N)

# Order payload updated: using "item" (singular) instead of "items"
ORDER_PAYLOAD='{
  "customerName": "Faba Thinks",
  "item": "item10",
  "total": 99.99,
  "status": "pending"
}'

# Call the send_post_request function with the new endpoint and payload
send_post_request "http://localhost:3000/api/order-create" "$IDEMPOTENCY_KEY" "$ORDER_PAYLOAD"

# Optional DB check for order DB
show-order-db-database-table

# List all running containers and show logs
list-running-containers

echo -e "\n✅✅✅ ALL TESTS ARE DONE!!! ✅✅✅"

# -----------------------------------------------------------------------------
# Note: If the orders table is still empty, you might need to drop the old 
# database volume (e.g., build-tools_order_db_data) so that the updated schema
# (with the "item" column) is created.
# -----------------------------------------------------------------------------
