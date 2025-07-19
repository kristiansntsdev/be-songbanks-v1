class TypeMapper {
    /**
     * Map Laravel column types to Sequelize types
     */
    static laravelToSequelize(laravelType, Sequelize) {
        const typeMap = {
            // String types
            'string': Sequelize.STRING,
            'char': Sequelize.CHAR,
            'text': Sequelize.TEXT,
            'mediumText': Sequelize.TEXT,
            'longText': Sequelize.TEXT,
            'binary': Sequelize.BLOB,
            
            // Numeric types
            'integer': Sequelize.INTEGER,
            'bigInteger': Sequelize.BIGINT,
            'smallInteger': Sequelize.SMALLINT,
            'tinyInteger': Sequelize.TINYINT,
            'decimal': Sequelize.DECIMAL,
            'float': Sequelize.FLOAT,
            'double': Sequelize.DOUBLE,
            'real': Sequelize.REAL,
            
            // Date types
            'date': Sequelize.DATEONLY,
            'dateTime': Sequelize.DATE,
            'timestamp': Sequelize.DATE,
            'time': Sequelize.TIME,
            
            // Boolean
            'boolean': Sequelize.BOOLEAN,
            
            // JSON
            'json': Sequelize.JSON,
            'jsonb': Sequelize.JSONB,
            
            // Special types
            'uuid': Sequelize.UUID,
            'enum': Sequelize.ENUM,
            
            // Geometry (if supported)
            'geometry': Sequelize.GEOMETRY,
            'point': Sequelize.GEOMETRY,
            
            // Network types
            'inet': Sequelize.INET,
            'cidr': Sequelize.CIDR,
            'macaddr': Sequelize.MACADDR
        };

        return typeMap[laravelType] || Sequelize.STRING;
    }

    /**
     * Map JavaScript types to Sequelize types
     */
    static jsToSequelize(jsType, Sequelize) {
        const typeMap = {
            'string': Sequelize.STRING,
            'number': Sequelize.INTEGER,
            'boolean': Sequelize.BOOLEAN,
            'object': Sequelize.JSON,
            'array': Sequelize.JSON,
            'date': Sequelize.DATE
        };

        return typeMap[jsType] || Sequelize.STRING;
    }

    /**
     * Get default value for a Sequelize type
     */
    static getDefaultValue(sequelizeType) {
        const defaults = {
            [sequelizeType.STRING]: '',
            [sequelizeType.TEXT]: '',
            [sequelizeType.INTEGER]: 0,
            [sequelizeType.BIGINT]: 0,
            [sequelizeType.DECIMAL]: 0.0,
            [sequelizeType.FLOAT]: 0.0,
            [sequelizeType.DOUBLE]: 0.0,
            [sequelizeType.BOOLEAN]: false,
            [sequelizeType.DATE]: () => new Date(),
            [sequelizeType.DATEONLY]: () => new Date().toISOString().split('T')[0],
            [sequelizeType.JSON]: {},
            [sequelizeType.JSONB]: {},
            [sequelizeType.UUID]: () => require('crypto').randomUUID()
        };

        return defaults[sequelizeType] || null;
    }

    /**
     * Validate type compatibility
     */
    static isCompatible(sourceType, targetType) {
        const compatibilityMap = {
            'string': ['text', 'char', 'varchar'],
            'integer': ['bigInteger', 'smallInteger', 'tinyInteger'],
            'decimal': ['float', 'double', 'real'],
            'date': ['dateTime', 'timestamp'],
            'json': ['jsonb', 'text']
        };

        if (sourceType === targetType) return true;

        return compatibilityMap[sourceType]?.includes(targetType) || false;
    }

    /**
     * Get SQL type string for migrations
     */
    static getSqlType(sequelizeType, options = {}) {
        const { length, precision, scale } = options;

        if (sequelizeType.key === 'STRING') {
            return `VARCHAR(${length || 255})`;
        }
        
        if (sequelizeType.key === 'CHAR') {
            return `CHAR(${length || 255})`;
        }
        
        if (sequelizeType.key === 'DECIMAL') {
            return `DECIMAL(${precision || 8},${scale || 2})`;
        }
        
        if (sequelizeType.key === 'FLOAT' && precision) {
            return `FLOAT(${precision}${scale ? `,${scale}` : ''})`;
        }

        // Return the base type name for others
        return sequelizeType.key;
    }

    /**
     * Parse column definition from existing table
     */
    static parseColumnDefinition(columnInfo) {
        const { type, allowNull, defaultValue, primaryKey, autoIncrement } = columnInfo;
        
        return {
            type: type,
            allowNull: allowNull !== false,
            defaultValue: defaultValue,
            primaryKey: primaryKey === true,
            autoIncrement: autoIncrement === true,
            unique: false // Would need additional query to detect
        };
    }

    /**
     * Generate validation rules based on type
     */
    static getValidationRules(type, options = {}) {
        const rules = {};

        if (type.key === 'STRING' || type.key === 'CHAR') {
            if (options.length) {
                rules.len = [0, options.length];
            }
            if (options.email) {
                rules.isEmail = true;
            }
            if (options.url) {
                rules.isUrl = true;
            }
        }

        if (type.key === 'INTEGER' || type.key === 'BIGINT') {
            rules.isInt = true;
            if (options.min !== undefined) {
                rules.min = options.min;
            }
            if (options.max !== undefined) {
                rules.max = options.max;
            }
        }

        if (type.key === 'DECIMAL' || type.key === 'FLOAT') {
            rules.isDecimal = true;
        }

        if (type.key === 'DATE' || type.key === 'DATEONLY') {
            rules.isDate = true;
        }

        return Object.keys(rules).length > 0 ? rules : null;
    }
}

module.exports = TypeMapper;