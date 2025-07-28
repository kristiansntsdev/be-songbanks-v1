class DateTypes {
  /**
   * Date only (YYYY-MM-DD)
   */
  static date() {
    return {
      type: "DATE",
      sequelizeType: function (Sequelize) {
        return Sequelize.DATEONLY;
      },
    };
  }

  /**
   * Date and time
   */
  static dateTime() {
    return {
      type: "DATETIME",
      sequelizeType: function (Sequelize) {
        return Sequelize.DATE;
      },
    };
  }

  /**
   * Timestamp (alias for dateTime)
   */
  static timestamp() {
    return {
      type: "TIMESTAMP",
      sequelizeType: function (Sequelize) {
        return Sequelize.DATE;
      },
    };
  }

  /**
   * Time only (HH:MM:SS)
   */
  static time() {
    return {
      type: "TIME",
      sequelizeType: function (Sequelize) {
        return Sequelize.TIME;
      },
    };
  }

  /**
   * Year only
   */
  static year() {
    return {
      type: "YEAR",
      sequelizeType: function (Sequelize) {
        return Sequelize.INTEGER; // Store as 4-digit integer
      },
      validate: {
        min: 1900,
        max: 2155,
      },
    };
  }

  /**
   * Timestamp with timezone
   */
  static timestampTz() {
    return {
      type: "TIMESTAMPTZ",
      sequelizeType: function (Sequelize) {
        return Sequelize.DATE;
      },
    };
  }

  /**
   * Add standard created_at and updated_at timestamps
   */
  static timestamps() {
    return {
      createdAt: {
        allowNull: false,
        type: "TIMESTAMP",
        sequelizeType: function (Sequelize) {
          return Sequelize.DATE;
        },
      },
      updatedAt: {
        allowNull: false,
        type: "TIMESTAMP",
        sequelizeType: function (Sequelize) {
          return Sequelize.DATE;
        },
      },
    };
  }

  /**
   * Soft delete timestamp
   */
  static softDeletes(columnName = "deletedAt") {
    return {
      [columnName]: {
        allowNull: true,
        type: "TIMESTAMP",
        sequelizeType: function (Sequelize) {
          return Sequelize.DATE;
        },
      },
    };
  }

  /**
   * Remember token expiration
   */
  static rememberTokenExpiry() {
    return {
      type: "REMEMBER_TOKEN_EXPIRY",
      sequelizeType: function (Sequelize) {
        return Sequelize.DATE;
      },
    };
  }
}

export default DateTypes;
