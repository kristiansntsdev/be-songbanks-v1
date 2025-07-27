class StringTypes {
  /**
   * Variable-length string with specified max length
   */
  static string(length = 255) {
    return {
      type: "STRING",
      length: length,
      sequelizeType: function (Sequelize) {
        return Sequelize.STRING(length);
      },
    };
  }

  /**
   * Large text field
   */
  static text() {
    return {
      type: "TEXT",
      sequelizeType: function (Sequelize) {
        return Sequelize.TEXT;
      },
    };
  }

  /**
   * Medium text field
   */
  static mediumText() {
    return {
      type: "MEDIUMTEXT",
      sequelizeType: function (Sequelize) {
        return Sequelize.TEXT("medium");
      },
    };
  }

  /**
   * Long text field
   */
  static longText() {
    return {
      type: "LONGTEXT",
      sequelizeType: function (Sequelize) {
        return Sequelize.TEXT("long");
      },
    };
  }

  /**
   * Fixed-length string
   */
  static char(length = 255) {
    return {
      type: "CHAR",
      length: length,
      sequelizeType: function (Sequelize) {
        return Sequelize.CHAR(length);
      },
    };
  }

  /**
   * UUID string type
   */
  static uuid() {
    return {
      type: "UUID",
      sequelizeType: function (Sequelize) {
        return Sequelize.UUID;
      },
    };
  }

  /**
   * ULID string type (26 characters)
   */
  static ulid() {
    return {
      type: "ULID",
      length: 26,
      sequelizeType: function (Sequelize) {
        return Sequelize.STRING(26);
      },
    };
  }

  /**
   * Email string type with validation
   */
  static email() {
    return {
      type: "EMAIL",
      length: 255,
      sequelizeType: function (Sequelize) {
        return Sequelize.STRING(255);
      },
      validate: {
        isEmail: true,
      },
    };
  }

  /**
   * URL string type with validation
   */
  static url() {
    return {
      type: "URL",
      length: 2048,
      sequelizeType: function (Sequelize) {
        return Sequelize.STRING(2048);
      },
      validate: {
        isUrl: true,
      },
    };
  }
}

module.exports = StringTypes;
