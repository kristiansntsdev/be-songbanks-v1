const SeederException = require('../exceptions/SeederException');

class SeederOperations {
    constructor(queryInterface, Sequelize) {
        this.queryInterface = queryInterface;
        this.Sequelize = Sequelize;
    }

    /**
     * Insert data with automatic duplicate handling
     */
    async safeInsert(tableName, data, options = {}) {
        const {
            uniqueFields = [],
            onDuplicate = 'skip', // 'skip', 'update', 'error'
            batchSize = 100
        } = options;

        const records = Array.isArray(data) ? data : [data];
        const results = {
            inserted: [],
            skipped: [],
            updated: [],
            errors: []
        };

        // Log start of automatic duplicate detection
        if (uniqueFields.length > 0) {
            console.log(`🔍 Automatic duplicate detection enabled for ${tableName} (checking: ${uniqueFields.join(', ')})`);
        }

        // Process in batches
        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            
            for (const record of batch) {
                try {
                    const existing = await this.checkExisting(tableName, record, uniqueFields);
                    
                    if (existing) {
                        await this.handleDuplicate(tableName, record, existing, onDuplicate, results);
                    } else {
                        await this.insertRecord(tableName, record);
                        results.inserted.push(record);
                    }
                } catch (error) {
                    results.errors.push({
                        record,
                        error: error.message
                    });
                    
                    if (options.stopOnError) {
                        throw error;
                    }
                }
            }
        }

        // Log final results with enhanced formatting
        const totalProcessed = results.inserted.length + results.skipped.length + results.updated.length + results.errors.length;
        console.log(`📊 Processing complete for ${tableName} (${totalProcessed} records):`);
        
        if (results.inserted.length > 0) {
            console.log(`   ✅ Inserted: ${results.inserted.length} new records`);
        }
        if (results.skipped.length > 0) {
            console.log(`   ⚠️  Skipped: ${results.skipped.length} duplicates (${onDuplicate} strategy)`);
        }
        if (results.updated.length > 0) {
            console.log(`   🔄 Updated: ${results.updated.length} existing records`);
        }
        if (results.errors.length > 0) {
            console.log(`   ❌ Errors: ${results.errors.length} failed records`);
        }

        return results;
    }

    /**
     * Check if record already exists
     */
    async checkExisting(tableName, record, uniqueFields) {
        if (uniqueFields.length === 0) {
            return null;
        }

        const whereCondition = {};
        for (const field of uniqueFields) {
            if (record[field] !== undefined) {
                whereCondition[field] = record[field];
            }
        }

        if (Object.keys(whereCondition).length === 0) {
            return null;
        }

        try {
            // Use sequelize query instead of rawSelect for better compatibility
            const results = await this.queryInterface.sequelize.query(
                `SELECT * FROM ${tableName} WHERE ${Object.keys(whereCondition).map(field => `${field} = ?`).join(' AND ')} LIMIT 1`,
                {
                    replacements: Object.values(whereCondition),
                    type: this.queryInterface.sequelize.QueryTypes.SELECT
                }
            );
            
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            // Table might not exist or other issues
            console.warn(`Warning: Could not check existing records in ${tableName}: ${error.message}`);
            return null;
        }
    }

    /**
     * Handle duplicate record based on strategy
     */
    async handleDuplicate(tableName, record, existing, strategy, results) {
        // Find the identifying field for better logging
        const identifyingField = Object.keys(record).find(key => 
            record[key] === existing[key] && ['email', 'name', 'slug', 'id'].includes(key)
        ) || Object.keys(record)[0];
        
        switch (strategy) {
            case 'skip':
                console.log(`   ⏭️  Skipping duplicate: ${identifyingField}='${record[identifyingField]}'`);
                results.skipped.push({
                    record,
                    existing,
                    reason: 'Duplicate found, skipped'
                });
                break;

            case 'update':
                console.log(`   🔄 Updating duplicate: ${identifyingField}='${record[identifyingField]}'`);
                await this.updateRecord(tableName, record, existing);
                results.updated.push({
                    record,
                    existing,
                    reason: 'Duplicate found, updated'
                });
                break;

            case 'error':
                throw SeederException.duplicateEntry(
                    tableName,
                    identifyingField,
                    record[identifyingField]
                );

            default:
                console.log(`   ❓ Unknown strategy for duplicate: ${identifyingField}='${record[identifyingField]}', skipping`);
                results.skipped.push({
                    record,
                    existing,
                    reason: 'Unknown strategy, skipped'
                });
        }
    }

    /**
     * Insert a single record
     */
    async insertRecord(tableName, record) {
        // Add ID if not present (using ULID)
        const { ulid } = require('ulid');
        
        // Add timestamps if not present
        const timestamp = new Date();
        const processedRecord = {
            ...record,
            id: record.id || ulid(),
            createdAt: record.createdAt || timestamp,
            updatedAt: record.updatedAt || timestamp
        };

        await this.queryInterface.bulkInsert(tableName, [processedRecord]);
    }

    /**
     * Update existing record
     */
    async updateRecord(tableName, record, existing) {
        const timestamp = new Date();
        const updateData = {
            ...record,
            updatedAt: timestamp
        };

        // Remove fields that shouldn't be updated
        delete updateData.id;
        delete updateData.createdAt;

        await this.queryInterface.bulkUpdate(
            tableName,
            updateData,
            { id: existing.id }
        );
    }

    /**
     * Upsert operation (insert or update)
     */
    async upsert(tableName, data, uniqueFields = [], options = {}) {
        return await this.safeInsert(tableName, data, {
            uniqueFields,
            onDuplicate: 'update',
            ...options
        });
    }

    /**
     * Insert only if not exists
     */
    async insertIfNotExists(tableName, data, uniqueFields = [], options = {}) {
        return await this.safeInsert(tableName, data, {
            uniqueFields,
            onDuplicate: 'skip',
            ...options
        });
    }

    /**
     * Truncate table safely
     */
    async safeTruncate(tableName, options = {}) {
        const { 
            cascade = false,
            restartIdentity = false,
            checkForeignKeys = true 
        } = options;

        try {
            if (checkForeignKeys) {
                const foreignKeys = await this.getForeignKeyReferences(tableName);
                if (foreignKeys.length > 0) {
                    console.warn(`⚠️  Table '${tableName}' has foreign key references: ${foreignKeys.join(', ')}`);
                    if (!options.force) {
                        throw new Error(`Cannot truncate table '${tableName}' due to foreign key constraints`);
                    }
                }
            }

            await this.queryInterface.bulkDelete(tableName, null, {
                cascade,
                restartIdentity
            });

            console.log(`🗑️  Truncated table: ${tableName}`);
        } catch (error) {
            console.error(`❌ Failed to truncate table '${tableName}': ${error.message}`);
            throw error;
        }
    }

    /**
     * Get tables that reference this table
     */
    async getForeignKeyReferences(tableName) {
        try {
            const dialect = this.queryInterface.sequelize.getDialect();
            
            let query;
            switch (dialect) {
                case 'mysql':
                case 'mariadb':
                    query = `
                        SELECT TABLE_NAME 
                        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
                        WHERE REFERENCED_TABLE_NAME = '${tableName}'
                    `;
                    break;
                case 'postgres':
                    query = `
                        SELECT tc.table_name
                        FROM information_schema.table_constraints tc
                        JOIN information_schema.key_column_usage kcu
                        ON tc.constraint_name = kcu.constraint_name
                        WHERE tc.constraint_type = 'FOREIGN KEY'
                        AND kcu.referenced_table_name = '${tableName}'
                    `;
                    break;
                default:
                    return [];
            }

            const results = await this.queryInterface.sequelize.query(query, {
                type: this.queryInterface.sequelize.QueryTypes.SELECT
            });

            return results.map(row => row.TABLE_NAME || row.table_name);
        } catch (error) {
            console.warn(`Warning: Could not check foreign key references for ${tableName}`);
            return [];
        }
    }

    /**
     * Validate record data
     */
    validateRecord(record, rules) {
        const errors = [];

        for (const [field, rule] of Object.entries(rules)) {
            const value = record[field];

            if (rule.required && (value === undefined || value === null || value === '')) {
                errors.push(`Field '${field}' is required`);
                continue;
            }

            if (value !== undefined && value !== null) {
                if (rule.type && typeof value !== rule.type) {
                    errors.push(`Field '${field}' must be of type ${rule.type}`);
                }

                if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
                    errors.push(`Field '${field}' must be at least ${rule.minLength} characters`);
                }

                if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
                    errors.push(`Field '${field}' must be at most ${rule.maxLength} characters`);
                }

                if (rule.min && typeof value === 'number' && value < rule.min) {
                    errors.push(`Field '${field}' must be at least ${rule.min}`);
                }

                if (rule.max && typeof value === 'number' && value > rule.max) {
                    errors.push(`Field '${field}' must be at most ${rule.max}`);
                }

                if (rule.enum && !rule.enum.includes(value)) {
                    errors.push(`Field '${field}' must be one of: ${rule.enum.join(', ')}`);
                }

                if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
                    errors.push(`Field '${field}' does not match required pattern`);
                }
            }
        }

        return errors;
    }
}

module.exports = SeederOperations;