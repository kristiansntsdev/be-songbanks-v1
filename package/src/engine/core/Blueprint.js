const { ulid } = require('ulid');
const ColumnBuilder = require('../builders/ColumnBuilder');
const IndexBuilder = require('../builders/IndexBuilder');
const ForeignKeyBuilder = require('../builders/ForeignKeyBuilder');
const ForeignIdBuilder = require('../builders/ForeignIdBuilder');
const StringTypes = require('../types/StringTypes');
const NumericTypes = require('../types/NumericTypes');
const DateTypes = require('../types/DateTypes');
const SpecialTypes = require('../types/SpecialTypes');
const TableOperations = require('../operations/TableOperations');

class Blueprint {
    constructor(tableName, queryInterface, Sequelize) {
        this.tableName = tableName;
        this.queryInterface = queryInterface;
        this.Sequelize = Sequelize;
        this.columns = {};
        this.indexes = [];
        this.foreignKeys = [];
        this.dropIndexes = [];
        
        // Initialize operations
        this.tableOps = new TableOperations(queryInterface, Sequelize);
        this.indexBuilder = new IndexBuilder(tableName, this);
    }

    // Primary key methods
    id(columnName = 'id') {
        const typeConfig = StringTypes.ulid();
        this.columns[columnName] = {
            allowNull: false,
            primaryKey: true,
            type: typeConfig.sequelizeType(this.Sequelize),
            defaultValue: () => ulid()
        };
        return this;
    }

    increments(columnName = 'id') {
        const typeConfig = NumericTypes.increments();
        this.columns[columnName] = {
            allowNull: false,
            primaryKey: true,
            type: typeConfig.sequelizeType(this.Sequelize),
            autoIncrement: true
        };
        return this;
    }

    bigIncrements(columnName = 'id') {
        const typeConfig = NumericTypes.bigIncrements();
        this.columns[columnName] = {
            allowNull: false,
            primaryKey: true,
            type: typeConfig.sequelizeType(this.Sequelize),
            autoIncrement: true
        };
        return this;
    }

    // String methods
    string(columnName, length = 255) {
        const typeConfig = StringTypes.string(length);
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true
        };
        return new ColumnBuilder(columnName, this);
    }

    text(columnName) {
        const typeConfig = StringTypes.text();
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true
        };
        return new ColumnBuilder(columnName, this);
    }

    mediumText(columnName) {
        const typeConfig = StringTypes.mediumText();
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true
        };
        return new ColumnBuilder(columnName, this);
    }

    longText(columnName) {
        const typeConfig = StringTypes.longText();
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true
        };
        return new ColumnBuilder(columnName, this);
    }

    char(columnName, length = 255) {
        const typeConfig = StringTypes.char(length);
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true
        };
        return new ColumnBuilder(columnName, this);
    }

    uuid(columnName) {
        const typeConfig = StringTypes.uuid();
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true
        };
        return new ColumnBuilder(columnName, this);
    }

    email(columnName) {
        const typeConfig = StringTypes.email();
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true,
            validate: typeConfig.validate
        };
        return new ColumnBuilder(columnName, this);
    }

    url(columnName) {
        const typeConfig = StringTypes.url();
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true,
            validate: typeConfig.validate
        };
        return new ColumnBuilder(columnName, this);
    }

    // Number methods
    integer(columnName) {
        const typeConfig = NumericTypes.integer();
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true
        };
        return new ColumnBuilder(columnName, this);
    }

    bigInteger(columnName) {
        const typeConfig = NumericTypes.bigInteger();
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true
        };
        return new ColumnBuilder(columnName, this);
    }

    smallInteger(columnName) {
        const typeConfig = NumericTypes.smallInteger();
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true
        };
        return new ColumnBuilder(columnName, this);
    }

    tinyInteger(columnName) {
        const typeConfig = NumericTypes.tinyInteger();
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true
        };
        return new ColumnBuilder(columnName, this);
    }

    decimal(columnName, precision = 8, scale = 2) {
        const typeConfig = NumericTypes.decimal(precision, scale);
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true
        };
        return new ColumnBuilder(columnName, this);
    }

    float(columnName, precision = null, scale = null) {
        const typeConfig = NumericTypes.float(precision, scale);
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true
        };
        return new ColumnBuilder(columnName, this);
    }

    double(columnName, precision = null, scale = null) {
        const typeConfig = NumericTypes.double(precision, scale);
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true
        };
        return new ColumnBuilder(columnName, this);
    }

    // Boolean method
    boolean(columnName) {
        const typeConfig = SpecialTypes.boolean();
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true,
            defaultValue: typeConfig.defaultValue
        };
        return new ColumnBuilder(columnName, this);
    }

    // Date methods
    date(columnName) {
        const typeConfig = DateTypes.date();
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true
        };
        return new ColumnBuilder(columnName, this);
    }

    dateTime(columnName) {
        const typeConfig = DateTypes.dateTime();
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true
        };
        return new ColumnBuilder(columnName, this);
    }

    timestamp(columnName) {
        const typeConfig = DateTypes.timestamp();
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true
        };
        return new ColumnBuilder(columnName, this);
    }

    time(columnName) {
        const typeConfig = DateTypes.time();
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true
        };
        return new ColumnBuilder(columnName, this);
    }

    year(columnName) {
        const typeConfig = DateTypes.year();
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true,
            validate: typeConfig.validate
        };
        return new ColumnBuilder(columnName, this);
    }

    // Timestamps
    timestamps() {
        const timestampTypes = DateTypes.timestamps();
        Object.assign(this.columns, {
            createdAt: {
                allowNull: timestampTypes.createdAt.allowNull,
                type: timestampTypes.createdAt.sequelizeType(this.Sequelize)
            },
            updatedAt: {
                allowNull: timestampTypes.updatedAt.allowNull,
                type: timestampTypes.updatedAt.sequelizeType(this.Sequelize)
            }
        });
        return this;
    }

    softDeletes(columnName = 'deletedAt') {
        const softDeleteType = DateTypes.softDeletes(columnName);
        Object.assign(this.columns, {
            [columnName]: {
                allowNull: softDeleteType[columnName].allowNull,
                type: softDeleteType[columnName].sequelizeType(this.Sequelize)
            }
        });
        return this;
    }

    // Special types
    enum(columnName, values) {
        const typeConfig = SpecialTypes.enum(values);
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true
        };
        return new ColumnBuilder(columnName, this);
    }

    json(columnName) {
        const typeConfig = SpecialTypes.json();
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true
        };
        return new ColumnBuilder(columnName, this);
    }

    jsonb(columnName) {
        const typeConfig = SpecialTypes.jsonb();
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true
        };
        return new ColumnBuilder(columnName, this);
    }

    // Foreign key method
    foreignId(columnName) {
        const typeConfig = StringTypes.ulid();
        this.columns[columnName] = {
            type: typeConfig.sequelizeType(this.Sequelize),
            allowNull: true
        };
        return new ForeignIdBuilder(columnName, this);
    }

    // Index methods
    index(columns, indexName = null) {
        return this.indexBuilder.index(columns, indexName);
    }

    unique(columns, indexName = null) {
        return this.indexBuilder.unique(columns, indexName);
    }

    composite(columns, indexName = null) {
        return this.indexBuilder.composite(columns, indexName);
    }

    // Foreign key constraint
    foreign(columnName) {
        return new ForeignKeyBuilder(columnName, this);
    }

    // Execute the blueprint
    async build() {
        await this.tableOps.createTable(this.tableName, this.columns);

        // Add indexes
        for (const index of this.indexes) {
            await this.queryInterface.addIndex(this.tableName, index.fields, {
                name: index.name,
                unique: index.unique || false
            });
        }

        // Add foreign keys
        for (const fk of this.foreignKeys) {
            await this.queryInterface.addConstraint(this.tableName, {
                fields: [fk.columnName],
                type: 'foreign key',
                name: fk.name || `fk_${this.tableName}_${fk.columnName}`,
                references: {
                    table: fk.referencedTable,
                    field: fk.referencedColumn
                },
                onDelete: fk.onDelete,
                onUpdate: fk.onUpdate
            });
        }
    }
}

module.exports = Blueprint;