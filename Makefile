include .env

.PHONY: help songbank-db migrate seed controller model migration seeder swagger-generate deploy

help:
	@echo "Available commands:"
	@echo "  Database:"
	@echo "    songbank-db              - Create MySQL database container"
	@echo "    migrate                  - Run database migrations"
	@echo "    migrate:undo             - Undo last migration"
	@echo "    seed                     - Run database seeders"
	@echo "    seed:undo                - Undo database seeders"
	@echo ""
	@echo "  Development:"
	@echo "    migration:create name=X  - Create new migration"
	@echo "    seeder:create name=X     - Create new seeder"
	@echo "    controller:create name=X - Create new controller"
	@echo "    model:create name=X      - Create new model"
	@echo ""
	@echo "  Server:"
	@echo "    start                    - Start development server"
	@echo "    docs                     - Open API documentation"
	@echo "    swagger-generate         - Generate Swagger documentation from models and controllers"
	@echo ""
	@echo "  Deployment:"
	@echo "    deploy                   - Deploy to hosting site via SSH"

# Database Commands
songbank-db:
	@echo "Creating MySQL database container accessible from other devices..."
	podman run -d \
		--name songbanks-mysql \
		-p 0.0.0.0:$(DB_PORT):3306 \
		-e MYSQL_ROOT_PASSWORD=$(DB_PASSWORD) \
		-e MYSQL_DATABASE=$(DB_DATABASE) \
		-e MYSQL_USER=$(DB_USERNAME) \
		-e MYSQL_PASSWORD=$(DB_PASSWORD) \
		mysql:8.0 --bind-address=0.0.0.0
	@echo "MySQL container created and running on port $(DB_PORT), accessible from other devices"

migrate:
	@echo "Running database migrations..."
	npx sequelize-cli db:migrate

migrate\:undo:
	@echo "Undoing last migration..."
	npx sequelize-cli db:migrate:undo

seed:
	@echo "Running database seeders..."
	npx sequelize-cli db:seed:all

seed\:undo:
	@echo "Undoing database seeders..."
	npx sequelize-cli db:seed:undo:all

# Development Commands
migration\:create:
	@if [ -z "$(name)" ]; then \
		echo "Usage: make migration:create name=your_migration_name"; \
		exit 1; \
	fi
	@node package migration:create $(name)

seeder\:create:
	@if [ -z "$(name)" ]; then \
		echo "Usage: make seeder:create name=your_seeder_name"; \
		exit 1; \
	fi
	@node package seeder:create $(name)

controller\:create:
	@if [ -z "$(name)" ]; then \
		echo "Usage: make controller:create name=YourController"; \
		exit 1; \
	fi
	@node package controller:create $(name)

model\:create:
	@if [ -z "$(name)" ]; then \
		echo "Usage: make model:create name=YourModel"; \
		exit 1; \
	fi
	@node package model:create $(name)

# Server Commands
start:
	@echo "Starting development server..."
	npm start

docs:
	@echo "Opening API documentation..."
	@if command -v open > /dev/null; then \
		open http://localhost:3000/api-docs; \
	else \
		echo "Please open http://localhost:3000/api-docs in your browser"; \
	fi

swagger-generate:
	@echo "Generating Swagger documentation from models and controllers..."
	npm run swagger:generate

# Deployment Commands
deploy:
	@echo "Deploying to hosting site..."
	@if [ -z "$(SSH_SERVER)" ] || [ -z "$(SSH_USERNAME)" ] || [ -z "$(SSH_DESTINATION_PATH)" ]; then \
		echo "Error: Please set SSH_SERVER, SSH_USERNAME, and SSH_DESTINATION_PATH in your .env file"; \
		exit 1; \
	fi
	@echo "Creating deployment archive..."
	tar --exclude='node_modules' --exclude='.git' --exclude='database/development.sqlite' -czf deploy.tar.gz .
	@echo "Uploading files to $(SSH_USERNAME)@$(SSH_SERVER)..."
	scp -P $(SSH_PORT) -i ~/.ssh/tahumeat deploy.tar.gz $(SSH_USERNAME)@$(SSH_SERVER):$(SSH_DESTINATION_PATH)/
	@echo "Extracting files on server..."
	ssh -p $(SSH_PORT) -i ~/.ssh/tahumeat $(SSH_USERNAME)@$(SSH_SERVER) "cd $(SSH_DESTINATION_PATH) && tar -xzf deploy.tar.gz && rm deploy.tar.gz"
	@echo "Cleaning up local archive..."
	rm deploy.tar.gz
	@echo "Deployment completed successfully!"