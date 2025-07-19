'use strict';

const { Seeder, FactoryTypes } = require('../../package/src/engine');

class TestUsersSeeder extends Seeder {
    /**
     * Run the database seeders.
     */
    async run() {
        console.log('🌱 Seeding test users...');

        // Define User factory with test-specific data
        this.factory('User', {
            password: () => 'password123', // Fixed password for all test users
            role: FactoryTypes.enum(['admin', 'member', 'guest']),
            status: FactoryTypes.enum(['active', 'pending', 'request', 'suspend'])
        });

        // Define specific user states
        const testUsers = [
            {
                email: 'active-user@test.com',
                password: 'password123',
                role: 'member',
                status: 'active'
            },
            {
                email: 'guest-user@test.com',
                password: 'password123',
                role: 'guest',
                status: 'pending'
            },
            {
                email: 'pending-user@test.com',
                password: 'password123',
                role: 'member',
                status: 'pending'
            },
            {
                email: 'request-user@test.com',
                password: 'password123',
                role: 'member',
                status: 'request'
            },
            {
                email: 'suspend-user@test.com',
                password: 'password123',
                role: 'member',
                status: 'suspend'
            },
            {
                email: 'admin-user@test.com',
                password: 'password123',
                role: 'admin',
                status: 'active'
            }
        ];

        // Automatic duplicate handling! No manual checking needed
        // The engine will automatically skip duplicates based on email field
        await this.insert('users', testUsers, {
            uniqueFields: ['email'],
            onDuplicate: 'skip'
        });

    }
}

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const seeder = new TestUsersSeeder(queryInterface, Sequelize);
        await seeder.execute();
    },

    async down(queryInterface, Sequelize) {
        const testEmails = [
            'active-user@test.com',
            'guest-user@test.com',
            'pending-user@test.com',
            'request-user@test.com',
            'suspend-user@test.com',
            'admin-user@test.com'
        ];

        await queryInterface.bulkDelete('users', {
            email: testEmails
        }, {});
        
        console.log('🗑️  Cleaned up test users');
    }
};