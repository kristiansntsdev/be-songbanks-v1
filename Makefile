include .env

.PHONY: help songbank-db migrate seed controller model migration seeder

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

# Database Commands
songbank-db:
	@echo "Creating MySQL database container..."
	podman run -d \
		--name songbanks-mysql \
		-p $(DB_PORT):3306 \
		-e MYSQL_ROOT_PASSWORD=$(DB_PASSWORD) \
		-e MYSQL_DATABASE=$(DB_DATABASE) \
		-e MYSQL_USER=$(DB_USERNAME) \
		-e MYSQL_PASSWORD=$(DB_PASSWORD) \
		mysql:8.0
	@echo "MySQL container created and running on port $(DB_PORT)"

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
	@echo "Creating migration: $(name)"
	@timestamp=$$(date +%Y%m%d%H%M%S); \
	filename="database/migrations/$${timestamp}-$(name).js"; \
	mkdir -p database/migrations; \
	cat > "$$filename" << 'EOF'
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add your migration code here
    // Example:
    // await queryInterface.createTable('table_name', {
    //   id: {
    //     allowNull: false,
    //     primaryKey: true,
    //     type: Sequelize.STRING(26)
    //   },
    //   name: {
    //     type: Sequelize.STRING,
    //     allowNull: false
    //   },
    //   createdAt: {
    //     allowNull: false,
    //     type: Sequelize.DATE
    //   },
    //   updatedAt: {
    //     allowNull: false,
    //     type: Sequelize.DATE
    //   }
    // });
  },

  async down(queryInterface, Sequelize) {
    // Add your rollback code here
    // Example:
    // await queryInterface.dropTable('table_name');
  }
};
EOF
	@echo "Migration created: $$filename"

seeder\:create:
	@if [ -z "$(name)" ]; then \
		echo "Usage: make seeder:create name=your_seeder_name"; \
		exit 1; \
	fi
	@echo "Creating seeder: $(name)"
	@timestamp=$$(date +%Y%m%d%H%M%S); \
	filename="database/seeders/$${timestamp}-$(name).js"; \
	mkdir -p database/seeders; \
	cat > "$$filename" << 'EOF'
'use strict';

const { ulid } = require('ulid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add your seeder code here
    // Example:
    // await queryInterface.bulkInsert('table_name', [{
    //   id: ulid(),
    //   name: 'Sample Name',
    //   createdAt: new Date(),
    //   updatedAt: new Date()
    // }], {});
  },

  async down(queryInterface, Sequelize) {
    // Add your rollback code here
    // Example:
    // await queryInterface.bulkDelete('table_name', null, {});
  }
};
EOF
	@echo "Seeder created: $$filename"

controller\:create:
	@if [ -z "$(name)" ]; then \
		echo "Usage: make controller:create name=YourController"; \
		exit 1; \
	fi
	@echo "Creating controller: $(name)"
	@mkdir -p app/controllers
	@filename="app/controllers/$(name).js"; \
	cat > "$$filename" << 'EOF'
const ErrorController = require('./ErrorController');

class $(name) {
    // GET /api/resource
    static async index(req, res) {
        try {
            // Add your logic here
            res.json({ message: 'Index method' });
        } catch (error) {
            ErrorController.handleError(error, req, res);
        }
    }

    // GET /api/resource/:id
    static async show(req, res) {
        try {
            // Add your logic here
            res.json({ message: 'Show method', id: req.params.id });
        } catch (error) {
            ErrorController.handleError(error, req, res);
        }
    }

    // POST /api/resource
    static async create(req, res) {
        try {
            // Add your logic here
            res.status(201).json({ message: 'Create method' });
        } catch (error) {
            ErrorController.handleError(error, req, res);
        }
    }

    // PUT /api/resource/:id
    static async update(req, res) {
        try {
            // Add your logic here
            res.json({ message: 'Update method', id: req.params.id });
        } catch (error) {
            ErrorController.handleError(error, req, res);
        }
    }

    // DELETE /api/resource/:id
    static async destroy(req, res) {
        try {
            // Add your logic here
            res.json({ message: 'Delete method', id: req.params.id });
        } catch (error) {
            ErrorController.handleError(error, req, res);
        }
    }
}

module.exports = $(name);
EOF
	@echo "Controller created: $$filename"

model\:create:
	@if [ -z "$(name)" ]; then \
		echo "Usage: make model:create name=YourModel"; \
		exit 1; \
	fi
	@echo "Creating model: $(name)"
	@mkdir -p app/models
	@filename="app/models/$(name).js"; \
	tablename=$$(echo "$(name)" | sed 's/\([A-Z]\)/_\1/g' | sed 's/^_//' | tr '[:upper:]' '[:lower:]')s; \
	cat > "$$filename" << EOF
const { DataTypes } = require('sequelize');
const { ulid } = require('ulid');
const sequelize = require('../../config/database');

const $(name) = sequelize.define('$$tablename', {
    id: {
        type: DataTypes.STRING(26),
        primaryKey: true,
        allowNull: false,
        defaultValue: () => ulid()
    },
    // Add your fields here
    // Example:
    // name: {
    //     type: DataTypes.STRING,
    //     allowNull: false
    // }
}, {
    indexes: [
        // Add your indexes here
        // Example:
        // {
        //     fields: ['name']
        // }
    ]
});

module.exports = $(name);
EOF
	@echo "Model created: $$filename"
	@echo "Table name: $$tablename"

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