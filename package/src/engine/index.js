// Core classes
const Migration = require('./core/Migration');
const Schema = require('./core/Schema');
const Blueprint = require('./core/Blueprint');

// Builders
const ColumnBuilder = require('./builders/ColumnBuilder');
const IndexBuilder = require('./builders/IndexBuilder');
const ForeignKeyBuilder = require('./builders/ForeignKeyBuilder');
const ForeignIdBuilder = require('./builders/ForeignIdBuilder');

// Types
const StringTypes = require('./types/StringTypes');
const NumericTypes = require('./types/NumericTypes');
const DateTypes = require('./types/DateTypes');
const SpecialTypes = require('./types/SpecialTypes');

// Operations
const TableOperations = require('./operations/TableOperations');

// Utils
const TableNameResolver = require('./utils/TableNameResolver');
const TypeMapper = require('./utils/TypeMapper');

// Exceptions
const MigrationException = require('./exceptions/MigrationException');
const SchemaException = require('./exceptions/SchemaException');

module.exports = {
    // Core exports
    Migration,
    Schema,
    Blueprint,
    
    // Builder exports
    ColumnBuilder,
    IndexBuilder,
    ForeignKeyBuilder,
    ForeignIdBuilder,
    
    // Type exports
    StringTypes,
    NumericTypes,
    DateTypes,
    SpecialTypes,
    
    // Operation exports
    TableOperations,
    
    // Utility exports
    TableNameResolver,
    TypeMapper,
    
    // Exception exports
    MigrationException,
    SchemaException,
    
    // Convenience factory methods
    createMigration: (queryInterface, Sequelize) => {
        return new Migration(queryInterface, Sequelize);
    },
    
    createSchema: (queryInterface, Sequelize) => {
        return new Schema(queryInterface, Sequelize);
    },
    
    createBlueprint: (tableName, queryInterface, Sequelize) => {
        return new Blueprint(tableName, queryInterface, Sequelize);
    }
};