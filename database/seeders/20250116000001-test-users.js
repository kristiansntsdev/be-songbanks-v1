'use strict';

const { ulid } = require('ulid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const testUsers = [
      {
        id: ulid(),
        email: 'active-user@test.com',
        password: 'password123',
        role: 'member',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: ulid(),
        email: 'guest-user@test.com',
        password: 'password123',
        role: 'guest',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: ulid(),
        email: 'pending-user@test.com',
        password: 'password123',
        role: 'member',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: ulid(),
        email: 'request-user@test.com',
        password: 'password123',
        role: 'member',
        status: 'request',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: ulid(),
        email: 'suspend-user@test.com',
        password: 'password123',
        role: 'member',
        status: 'suspend',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: ulid(),
        email: 'admin-user@test.com',
        password: 'password123',
        role: 'admin',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Check if users already exist and insert only new ones
    for (const user of testUsers) {
      const existingUser = await queryInterface.rawSelect('users', {
        where: { email: user.email }
      }, ['id']);

      if (!existingUser) {
        await queryInterface.bulkInsert('users', [user], {});
      }
    }
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
  }
};