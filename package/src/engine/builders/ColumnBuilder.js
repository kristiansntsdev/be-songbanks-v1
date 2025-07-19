class ColumnBuilder {
    constructor(columnName, blueprint) {
        this.columnName = columnName;
        this.blueprint = blueprint;
    }

    /**
     * Set column as nullable
     */
    nullable() {
        this.blueprint.columns[this.columnName].allowNull = true;
        return this;
    }

    /**
     * Set column as not nullable
     */
    notNullable() {
        this.blueprint.columns[this.columnName].allowNull = false;
        return this;
    }

    /**
     * Set default value for column
     */
    default(value) {
        this.blueprint.columns[this.columnName].defaultValue = value;
        return this;
    }

    /**
     * Set column as unique
     */
    unique() {
        this.blueprint.columns[this.columnName].unique = true;
        return this;
    }

    /**
     * Add index on this column
     */
    index(indexName = null) {
        this.blueprint.index(this.columnName, indexName);
        return this;
    }

    /**
     * Add comment to column
     */
    comment(comment) {
        this.blueprint.columns[this.columnName].comment = comment;
        return this;
    }

    /**
     * Set column after another column (for table modifications)
     */
    after(columnName) {
        this.blueprint.columns[this.columnName].after = columnName;
        return this;
    }

    /**
     * Set column as first (for table modifications)
     */
    first() {
        this.blueprint.columns[this.columnName].first = true;
        return this;
    }
}

module.exports = ColumnBuilder;