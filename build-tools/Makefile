# Environment file and variables
ENV_FILE := .env
WAIT_TIME ?= 5  # Default wait time is 5 seconds, can be overridden

## build: Stops and removes all running containers, builds the project, and starts docker-compose
build: stop_all_containers clear_rabbitmq_data check_postgres
	echo "🚀 Building (when required) and starting docker images with environment variables..."
	docker-compose up --build -d
	echo "✅ Docker images built and started!"
	$(MAKE) wait_for_services
	echo "✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅"
	echo "📜 Fetching logs for all services..."
	docker-compose logs --tail=20
	echo "🚀 Running Containers:"
	docker ps
	echo "✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅✅"
	$(MAKE) wait_for_integration_test
	$(MAKE) integration_test

## stop_all_containers: Stops and removes all running Docker containers
stop_all_containers:
	$(MAKE) stop_down_containers

## Selectively build a specific service
build_service:
	@if [ -z "$(SERVICE)" ]; then \
		echo "❌ Please provide a service name. Example: make build_service SERVICE=user-service"; \
		exit 1; \
	fi
	echo "🚀 Building $(SERVICE)..."
	docker-compose build $(SERVICE)
	echo "✅ Done!"

## Selectively build a specific database
build_db:
	@if [ -z "$(DB)" ]; then \
		echo "❌ Please provide a database name. Example: make build_db DB=user-db"; \
		exit 1; \
	fi
	echo "🚀 Building $(DB)..."
	docker-compose build $(DB)
	echo "✅ Done!"

## wait_for_services: Waits for the services to initialize by showing animated dots
wait_for_services:
	echo -n "⏳ Waiting for $(WAIT_TIME) seconds to allow services to initialize "
	for i in $$(seq 1 $(WAIT_TIME)); do \
		echo -n "."; \
		sleep 1; \
	done
	echo " ✅"

## wait_for_integration_test: Waits before running integration tests
wait_for_integration_test:
	echo -n "⏳ Waiting for $(WAIT_TIME) seconds to allow services to be ready "
	for i in $$(seq 1 $(WAIT_TIME)); do \
		echo -n "."; \
		sleep 1; \
	done
	echo " ✅"



## clear_rabbitmq_data: Removes RabbitMQ data volume and cleans up related resources
clear_rabbitmq_data:
	@echo "⚡ Clearing RabbitMQ data..."
	# Remove RabbitMQ volume directly by name
	docker volume rm build-tools_rabbitmq_db_data
	@echo "✅ RabbitMQ data cleared!"



## stop_down_containers: Stops and removes specific or all Docker containers
stop_down_containers:
	@if [ -z "$(CONTAINER)" ]; then \
		echo "🔍 Checking for running containers..."; \
		if [ -n "$$(docker ps -q)" ]; then \
			echo "🛑 Stopping all running Docker containers..."; \
			docker stop $$(docker ps -q); \
			echo "🗑️ Removing all stopped containers..."; \
			docker rm $$(docker ps -aq); \
			echo "✅ All containers stopped and removed."; \
			echo "🛑 Stopping docker-compose..."; \
			docker-compose down; \
			echo "✅ Done!"; \
		else \
			echo "⚡ No running containers found. Skipping stop and remove."; \
		fi \
	else \
		echo "🛑 Stopping container: $(CONTAINER)"; \
		if docker ps --filter "name=$(CONTAINER)" --format "{{.Names}}" | grep -wq "$(CONTAINER)"; then \
			docker stop $(CONTAINER); \
			docker rm $(CONTAINER); \
			echo "✅ Container $(CONTAINER) stopped and removed."; \
		else \
			echo "⚠️ Container $(CONTAINER) not found or already stopped."; \
		fi \
	fi


check_postgres:
	@if sudo lsof -i :5432 | grep LISTEN; then \
		echo "PostgreSQL is running on port 5432. Stopping it..."; \
		sudo systemctl stop postgresql; \
		sleep 2; \
		if sudo lsof -i :5432 | grep LISTEN; then \
			echo "Failed to stop PostgreSQL!"; \
			exit 1; \
		else \
			echo "PostgreSQL stopped successfully!"; \
		fi \
	else \
		echo "PostgreSQL is not running on port 5432."; \
	fi	



## logs: Shows logs from all services
logs:
	echo "📜 Fetching last 20 logs for all services..."
	docker-compose logs --tail=20 -f

## help: Displays the list of available commands
help:
	@grep -E '^##' $(MAKEFILE_LIST) | sed -e 's/## //'

## integration_test: Runs integration tests for all services
integration_test:
	echo "🔍 Running integration tests..."
	./integration-test.sh
	echo "✅ Integration tests completed successfully!"
