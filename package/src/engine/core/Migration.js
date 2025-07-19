const Schema = require('./Schema');

class Migration {
    constructor(queryInterface, Sequelize) {
        this.queryInterface = queryInterface;
        this.Sequelize = Sequelize;
        this.Schema = new Schema(queryInterface, Sequelize);
    }

    /**
     * Run the migrations.
     * Override this method in your migration classes
     */
    async up() {
        throw new Error('up() method must be implemented in migration class');
    }

    /**
     * Reverse the migrations.
     * Override this method in your migration classes
     */
    async down() {
        throw new Error('down() method must be implemented in migration class');
    }

    /**
     * Execute the migration
     */
    async execute(direction = 'up') {
        if (direction === 'up') {
            await this.up();
        } else if (direction === 'down') {
            await this.down();
        } else {
            throw new Error(`Invalid migration direction: ${direction}`);
        }
    }
}

module.exports = Migration;