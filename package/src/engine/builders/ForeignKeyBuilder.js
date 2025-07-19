class ForeignKeyBuilder {
    constructor(columnName, blueprint) {
        this.columnName = columnName;
        this.blueprint = blueprint;
        this.constraint = {
            columnName: columnName,
            onDelete: 'CASCADE',
            onUpdate: 'CASCADE'
        };
    }

    /**
     * Set the referenced table and column
     */
    references(table, column = 'id') {
        this.constraint.referencedTable = table;
        this.constraint.referencedColumn = column;
        
        // Add to blueprint's foreign keys
        this.blueprint.foreignKeys.push(this.constraint);
        return this;
    }

    /**
     * Set ON DELETE action
     */
    onDelete(action) {
        const validActions = ['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'];
        if (!validActions.includes(action.toUpperCase())) {
            throw new Error(`Invalid onDelete action: ${action}. Must be one of: ${validActions.join(', ')}`);
        }
        this.constraint.onDelete = action.toUpperCase();
        return this;
    }

    /**
     * Set ON UPDATE action
     */
    onUpdate(action) {
        const validActions = ['CASCADE', 'SET NULL', 'RESTRICT', 'NO ACTION'];
        if (!validActions.includes(action.toUpperCase())) {
            throw new Error(`Invalid onUpdate action: ${action}. Must be one of: ${validActions.join(', ')}`);
        }
        this.constraint.onUpdate = action.toUpperCase();
        return this;
    }

    /**
     * Set custom constraint name
     */
    constraintName(name) {
        this.constraint.name = name;
        return this;
    }

    /**
     * Shorthand for CASCADE on both delete and update
     */
    cascade() {
        this.constraint.onDelete = 'CASCADE';
        this.constraint.onUpdate = 'CASCADE';
        return this;
    }

    /**
     * Shorthand for RESTRICT on both delete and update
     */
    restrict() {
        this.constraint.onDelete = 'RESTRICT';
        this.constraint.onUpdate = 'RESTRICT';
        return this;
    }

    /**
     * Shorthand for SET NULL on both delete and update
     */
    nullOnDelete() {
        this.constraint.onDelete = 'SET NULL';
        return this;
    }
}

module.exports = ForeignKeyBuilder;