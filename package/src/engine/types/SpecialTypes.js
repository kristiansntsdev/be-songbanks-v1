class SpecialTypes {
    /**
     * Boolean type
     */
    static boolean() {
        return {
            type: 'BOOLEAN',
            sequelizeType: function(Sequelize) {
                return Sequelize.BOOLEAN;
            },
            defaultValue: false
        };
    }

    /**
     * Enum type with predefined values
     */
    static enum(values) {
        if (!Array.isArray(values) || values.length === 0) {
            throw new Error('Enum values must be a non-empty array');
        }
        
        return {
            type: 'ENUM',
            values: values,
            sequelizeType: function(Sequelize) {
                return Sequelize.ENUM(...values);
            }
        };
    }

    /**
     * JSON type
     */
    static json() {
        return {
            type: 'JSON',
            sequelizeType: function(Sequelize) {
                return Sequelize.JSON;
            }
        };
    }

    /**
     * JSONB type (PostgreSQL)
     */
    static jsonb() {
        return {
            type: 'JSONB',
            sequelizeType: function(Sequelize) {
                return Sequelize.JSONB;
            }
        };
    }

    /**
     * Binary data
     */
    static binary() {
        return {
            type: 'BLOB',
            sequelizeType: function(Sequelize) {
                return Sequelize.BLOB;
            }
        };
    }

    /**
     * Geometry type (for spatial data)
     */
    static geometry(geometryType = null, srid = null) {
        return {
            type: 'GEOMETRY',
            geometryType: geometryType,
            srid: srid,
            sequelizeType: function(Sequelize) {
                if (geometryType && srid) {
                    return Sequelize.GEOMETRY(geometryType, srid);
                } else if (geometryType) {
                    return Sequelize.GEOMETRY(geometryType);
                }
                return Sequelize.GEOMETRY;
            }
        };
    }

    /**
     * Point type (spatial)
     */
    static point(srid = null) {
        return {
            type: 'POINT',
            srid: srid,
            sequelizeType: function(Sequelize) {
                return srid ? Sequelize.GEOMETRY('POINT', srid) : Sequelize.GEOMETRY('POINT');
            }
        };
    }

    /**
     * Array type (PostgreSQL)
     */
    static array(type) {
        return {
            type: 'ARRAY',
            arrayType: type,
            sequelizeType: function(Sequelize) {
                return Sequelize.ARRAY(type.sequelizeType(Sequelize));
            }
        };
    }

    /**
     * Range type (PostgreSQL)
     */
    static range(subtype) {
        return {
            type: 'RANGE',
            subtype: subtype,
            sequelizeType: function(Sequelize) {
                return Sequelize.RANGE(subtype.sequelizeType(Sequelize));
            }
        };
    }

    /**
     * Virtual column (computed, not stored)
     */
    static virtual(returnType, fields = []) {
        return {
            type: 'VIRTUAL',
            returnType: returnType,
            fields: fields,
            sequelizeType: function(Sequelize) {
                return Sequelize.VIRTUAL(returnType.sequelizeType(Sequelize), fields);
            }
        };
    }

    /**
     * CIDR type (network addresses)
     */
    static cidr() {
        return {
            type: 'CIDR',
            sequelizeType: function(Sequelize) {
                return Sequelize.CIDR;
            }
        };
    }

    /**
     * INET type (IP addresses)
     */
    static inet() {
        return {
            type: 'INET',
            sequelizeType: function(Sequelize) {
                return Sequelize.INET;
            }
        };
    }

    /**
     * MAC address type
     */
    static macaddr() {
        return {
            type: 'MACADDR',
            sequelizeType: function(Sequelize) {
                return Sequelize.MACADDR;
            }
        };
    }
}

module.exports = SpecialTypes;