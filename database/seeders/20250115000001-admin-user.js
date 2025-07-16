'use strict';

const { ulid } = require('ulid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const existingUser = await queryInterface.rawSelect('users', {
      where: { email: 'admin-test@gmail.com' }
    }, ['id']);

    if (!existingUser) {
      await queryInterface.bulkInsert('users', [{
        id: ulid(),
        email: 'admin-test@gmail.com',
        password: 'admin',
        createdAt: new Date(),
        updatedAt: new Date()
      }], {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      email: 'admin-test@gmail.com'
    }, {});
  }
};