class TableOperations {
    constructor(queryInterface, Sequelize) {
        this.queryInterface = queryInterface;
        this.Sequelize = Sequelize;
    }

    /**
     * Create a new table
     */
    async createTable(tableName, columns, options = {}) {
        const processedColumns = this._processColumns(columns);
        
        const tableOptions = {
            ...options,
            charset: options.charset || 'utf8mb4',
            collate: options.collate || 'utf8mb4_unicode_ci'
        };

        await this.queryInterface.createTable(tableName, processedColumns, tableOptions);
    }

    /**
     * Drop a table
     */
    async dropTable(tableName, options = {}) {
        const dropOptions = {
            cascade: options.cascade || false
        };

        await this.queryInterface.dropTable(tableName, dropOptions);
    }

    /**
     * Drop table if exists
     */
    async dropTableIfExists(tableName, options = {}) {
        try {
            await this.dropTable(tableName, options);
        } catch (error) {
            // Ignore error if table doesn't exist
            if (!this._isTableNotFoundError(error)) {
                throw error;
            }
        }
    }

    /**
     * Rename a table
     */
    async renameTable(oldTableName, newTableName) {
        await this.queryInterface.renameTable(oldTableName, newTableName);
    }

    /**
     * Check if table exists
     */
    async tableExists(tableName) {
        try {
            await this.queryInterface.describeTable(tableName);
            return true;
        } catch (error) {
            if (this._isTableNotFoundError(error)) {
                return false;
            }
            throw error;
        }
    }

    /**
     * Get table description
     */
    async describeTable(tableName) {
        return await this.queryInterface.describeTable(tableName);
    }

    /**
     * Truncate table (remove all data)
     */
    async truncateTable(tableName, options = {}) {
        const truncateOptions = {
            cascade: options.cascade || false,
            restartIdentity: options.restartIdentity || false
        };

        // Sequelize doesn't have direct truncate, so we use raw SQL
        const dialect = this.queryInterface.sequelize.getDialect();
        
        let sql;
        switch (dialect) {
            case 'postgres':
                sql = `TRUNCATE TABLE "${tableName}"`;
                if (truncateOptions.restartIdentity) {
                    sql += ' RESTART IDENTITY';
                }
                if (truncateOptions.cascade) {
                    sql += ' CASCADE';
                }
                break;
            case 'mysql':
            case 'mariadb':
                sql = `TRUNCATE TABLE \`${tableName}\``;
                break;
            case 'sqlite':
                sql = `DELETE FROM "${tableName}"`;
                break;
            default:
                sql = `TRUNCATE TABLE "${tableName}"`;
        }

        await this.queryInterface.sequelize.query(sql);
    }

    /**
     * Process column definitions to Sequelize format
     */
    _processColumns(columns) {
        const processed = {};
        
        for (const [name, definition] of Object.entries(columns)) {
            if (definition.sequelizeType) {
                // Use custom type definition
                processed[name] = {
                    type: definition.sequelizeType(this.Sequelize),
                    allowNull: definition.allowNull !== undefined ? definition.allowNull : true,
                    defaultValue: definition.defaultValue,
                    primaryKey: definition.primaryKey || false,
                    autoIncrement: definition.autoIncrement || false,
                    unique: definition.unique || false,
                    comment: definition.comment,
                    validate: definition.validate
                };
            } else {
                // Direct Sequelize definition
                processed[name] = definition;
            }
        }
        
        return processed;
    }

    /**
     * Check if error is table not found
     */
    _isTableNotFoundError(error) {
        const message = error.message.toLowerCase();
        return message.includes('table') && 
               (message.includes('does not exist') || 
                message.includes('doesn\'t exist') ||
                message.includes('not found'));
    }
}

module.exports = TableOperations;