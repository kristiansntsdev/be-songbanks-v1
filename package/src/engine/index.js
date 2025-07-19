// Core classes
const Migration = require('./core/Migration');
const Schema = require('./core/Schema');
const Blueprint = require('./core/Blueprint');
const Factory = require('./core/Factory');
const Seeder = require('./core/Seeder');

// Builders
const ColumnBuilder = require('./builders/ColumnBuilder');
const IndexBuilder = require('./builders/IndexBuilder');
const ForeignKeyBuilder = require('./builders/ForeignKeyBuilder');
const ForeignIdBuilder = require('./builders/ForeignIdBuilder');
const FactoryBuilder = require('./builders/FactoryBuilder');

// Types
const StringTypes = require('./types/StringTypes');
const NumericTypes = require('./types/NumericTypes');
const DateTypes = require('./types/DateTypes');
const SpecialTypes = require('./types/SpecialTypes');
const FactoryTypes = require('./types/FactoryTypes');

// Operations
const TableOperations = require('./operations/TableOperations');
const SeederOperations = require('./operations/SeederOperations');

// Utils
const TableNameResolver = require('./utils/TableNameResolver');
const TypeMapper = require('./utils/TypeMapper');

// Exceptions
const MigrationException = require('./exceptions/MigrationException');
const SchemaException = require('./exceptions/SchemaException');
const SeederException = require('./exceptions/SeederException');

module.exports = {
    // Core exports
    Migration,
    Schema,
    Blueprint,
    Factory,
    Seeder,
    
    // Builder exports
    ColumnBuilder,
    IndexBuilder,
    ForeignKeyBuilder,
    ForeignIdBuilder,
    FactoryBuilder,
    
    // Type exports
    StringTypes,
    NumericTypes,
    DateTypes,
    SpecialTypes,
    FactoryTypes,
    
    // Operation exports
    TableOperations,
    SeederOperations,
    
    // Utility exports
    TableNameResolver,
    TypeMapper,
    
    // Exception exports
    MigrationException,
    SchemaException,
    SeederException,
    
    // Convenience factory methods
    createMigration: (queryInterface, Sequelize) => {
        return new Migration(queryInterface, Sequelize);
    },
    
    createSchema: (queryInterface, Sequelize) => {
        return new Schema(queryInterface, Sequelize);
    },
    
    createBlueprint: (tableName, queryInterface, Sequelize) => {
        return new Blueprint(tableName, queryInterface, Sequelize);
    },
    
    createFactory: (modelName, definition) => {
        return Factory.define(modelName, definition);
    },
    
    createSeeder: (queryInterface, Sequelize) => {
        return new Seeder(queryInterface, Sequelize);
    }
};