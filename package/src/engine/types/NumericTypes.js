class NumericTypes {
  /**
   * Standard integer
   */
  static integer() {
    return {
      type: "INTEGER",
      sequelizeType: function (Sequelize) {
        return Sequelize.INTEGER;
      },
    };
  }

  /**
   * Big integer (64-bit)
   */
  static bigInteger() {
    return {
      type: "BIGINT",
      sequelizeType: function (Sequelize) {
        return Sequelize.BIGINT;
      },
    };
  }

  /**
   * Small integer (16-bit)
   */
  static smallInteger() {
    return {
      type: "SMALLINT",
      sequelizeType: function (Sequelize) {
        return Sequelize.SMALLINT;
      },
    };
  }

  /**
   * Tiny integer (8-bit)
   */
  static tinyInteger() {
    return {
      type: "TINYINT",
      sequelizeType: function (Sequelize) {
        return Sequelize.TINYINT;
      },
    };
  }

  /**
   * Decimal with precision and scale
   */
  static decimal(precision = 8, scale = 2) {
    return {
      type: "DECIMAL",
      precision: precision,
      scale: scale,
      sequelizeType: function (Sequelize) {
        return Sequelize.DECIMAL(precision, scale);
      },
    };
  }

  /**
   * Float (single precision)
   */
  static float(precision = null, scale = null) {
    return {
      type: "FLOAT",
      precision: precision,
      scale: scale,
      sequelizeType: function (Sequelize) {
        if (precision && scale) {
          return Sequelize.FLOAT(precision, scale);
        }
        return Sequelize.FLOAT;
      },
    };
  }

  /**
   * Double (double precision)
   */
  static double(precision = null, scale = null) {
    return {
      type: "DOUBLE",
      precision: precision,
      scale: scale,
      sequelizeType: function (Sequelize) {
        if (precision && scale) {
          return Sequelize.DOUBLE(precision, scale);
        }
        return Sequelize.DOUBLE;
      },
    };
  }

  /**
   * Real number
   */
  static real() {
    return {
      type: "REAL",
      sequelizeType: function (Sequelize) {
        return Sequelize.REAL;
      },
    };
  }

  /**
   * Auto-incrementing integer (for primary keys)
   */
  static increments() {
    return {
      type: "INCREMENTS",
      sequelizeType: function (Sequelize) {
        return Sequelize.INTEGER;
      },
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    };
  }

  /**
   * Auto-incrementing big integer
   */
  static bigIncrements() {
    return {
      type: "BIG_INCREMENTS",
      sequelizeType: function (Sequelize) {
        return Sequelize.BIGINT;
      },
      autoIncrement: true,
      primaryKey: true,
      allowNull: false,
    };
  }

  /**
   * Unsigned integer
   */
  static unsignedInteger() {
    return {
      type: "UNSIGNED_INTEGER",
      sequelizeType: function (Sequelize) {
        return Sequelize.INTEGER.UNSIGNED;
      },
    };
  }

  /**
   * Unsigned big integer
   */
  static unsignedBigInteger() {
    return {
      type: "UNSIGNED_BIGINT",
      sequelizeType: function (Sequelize) {
        return Sequelize.BIGINT.UNSIGNED;
      },
    };
  }
}

module.exports = NumericTypes;
