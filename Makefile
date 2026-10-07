.PHONY: help build up down restart logs shell clean rebuild ps stop start

# Default target
.DEFAULT_GOAL := help

# Variables
COMPOSE_FILE := docker-compose.yml
ENV_FILE := .env
CONTAINER_NAME := front_end_dashboards_app
SERVICE_NAME := front_end_dashboards_app

DOCKER_COMPOSE := docker compose 

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

build: ## Build the Docker image
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "Warning: $(ENV_FILE) file not found. Some variables may not be set."; \
	fi
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) build

build-no-cache: ## Build the Docker image without cache
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "Warning: $(ENV_FILE) file not found. Some variables may not be set."; \
	fi
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) build --no-cache

up: ## Start the containers in detached mode
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "Error: $(ENV_FILE) file not found. Please create it first."; \
		exit 1; \
	fi
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) up -d

start: up ## Alias for up

down: ## Stop and remove containers
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) down

stop: ## Stop containers without removing them
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) stop

restart: ## Restart containers
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) restart

logs: ## Show logs from containers
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) logs -f

logs-tail: ## Show last 100 lines of logs
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) logs --tail=100

shell: ## Open a shell in the running container
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) exec $(SERVICE_NAME) /bin/sh

exec: shell ## Alias for shell

ps: ## Show running containers
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) ps

clean: ## Stop containers and remove volumes
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) down -v

clean-all: clean ## Remove containers, volumes, and images
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) down -v --rmi all

rebuild: down build up ## Rebuild and restart containers

rebuild-no-cache: down build-no-cache up ## Rebuild without cache and restart

install: ## Install dependencies (runs inside container)
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) exec $(SERVICE_NAME) sh -c "cd appDashboards && npm install --force"

dev: ## Start in development mode (requires DEBUG_APP=true in .env)
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "Error: $(ENV_FILE) file not found. Please create it first."; \
		exit 1; \
	fi
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) up

prod: ## Start in production mode (requires DEBUG_APP=false in .env)
	@if [ ! -f $(ENV_FILE) ]; then \
		echo "Error: $(ENV_FILE) file not found. Please create it first."; \
		exit 1; \
	fi
	$(DOCKER_COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) up -d

status: ps ## Show container status

inspect: ## Inspect the container
	docker inspect $(CONTAINER_NAME) || $(DOCKER_COMPOSE) -f $(COMPOSE_FILE) --env-file $(ENV_FILE) ps

