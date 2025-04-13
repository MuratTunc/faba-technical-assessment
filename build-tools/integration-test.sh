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
  
  # Extract order ID from the response
  ORDER_ID=$(echo "$RESPONSE" | jq -r '.orderId')
  echo "📦 Extracted Order ID: $ORDER_ID"

  if [ "$MESSAGE" == "Order created successfully!" ] && [ "$ORDER_ID" != "null" ]; then
    echo "✅ Order creation response is correct!"
  else
    echo "❌ Unexpected response: $MESSAGE"
    exit 1
  fi

  # Export for access in main flow
  export CREATED_ORDER_ID="$ORDER_ID"
}

# Function to send a POST request to /order-cancel using created orderId
send_cancel_request() {
  local order_id=$1
  local cancel_url="http://localhost:3000/api/order-cancel"
  local cancel_idempotency_key="cancel-$IDEMPOTENCY_KEY"
  
  CANCEL_PAYLOAD=$(jq -n \
    --arg orderId "$order_id" \
    --arg reason "Testing cancellation" \
    '{orderId: $orderId, reason: $reason}')

  echo "📤 Sending order cancellation for orderId: $order_id..."

  CANCEL_RESPONSE=$(curl -s -X POST "$cancel_url" \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: $cancel_idempotency_key" \
    -d "$CANCEL_PAYLOAD")

  echo "🔍 Raw cancel response: $CANCEL_RESPONSE"

  CANCEL_MESSAGE=$(echo "$CANCEL_RESPONSE" | jq -r '.message')

  if [ "$CANCEL_MESSAGE" == "Order cancellation requested" ]; then
    echo "✅ Order cancel response is correct!"
  else
    echo "❌ Unexpected cancel response: $CANCEL_MESSAGE"
    exit 1
  fi
}

### 🚀 Test Order Creation

# -----------------------------------------------------------------------------------------#
ORDER_PAYLOAD='{
  "customerName": "Faba Thinks",
  "item": "item105",
  "total": 99.99,
  "status": "active"
}'
IDEMPOTENCY_KEY=$(date +%s%N) # Generate a unique Idempotency Key (using nanosecond timestamp)
send_post_request "http://localhost:3000/api/order-create" "$IDEMPOTENCY_KEY" "$ORDER_PAYLOAD"
show-order-db-database-table
# -----------------------------------------------------------------------------------------#



# -----------------------------------------------------------------------------------------#
ORDER_PAYLOAD='{
  "customerName": "Faba Thinks Twice",
  "item": "item101",
  "total": 99.99,
  "status": "cancel"
}'
IDEMPOTENCY_KEY=$(date +%s%N)
send_post_request "http://localhost:3000/api/order-create" "$IDEMPOTENCY_KEY" "$ORDER_PAYLOAD"
show-order-db-database-table
# -----------------------------------------------------------------------------------------#



send_cancel_request "$CREATED_ORDER_ID"
show-order-db-database-table




# List all running containers and show logs
# list-running-containers

echo -e "\n✅✅✅ ALL TESTS ARE DONE!!! ✅✅✅"
