class IndexBuilder {
  constructor(tableName, blueprint) {
    this.tableName = tableName;
    this.blueprint = blueprint;
  }

  /**
   * Create a regular index
   */
  index(columns, indexName = null) {
    const columnArray = Array.isArray(columns) ? columns : [columns];
    const name = indexName || `idx_${this.tableName}_${columnArray.join("_")}`;

    this.blueprint.indexes.push({
      fields: columnArray,
      name: name,
      type: "index",
    });
    return this;
  }

  /**
   * Create a unique index
   */
  unique(columns, indexName = null) {
    const columnArray = Array.isArray(columns) ? columns : [columns];
    const name = indexName || `uniq_${this.tableName}_${columnArray.join("_")}`;

    this.blueprint.indexes.push({
      fields: columnArray,
      name: name,
      unique: true,
      type: "unique",
    });
    return this;
  }

  /**
   * Create a composite index
   */
  composite(columns, indexName = null) {
    if (!Array.isArray(columns) || columns.length < 2) {
      throw new Error("Composite index requires at least 2 columns");
    }

    const name = indexName || `comp_${this.tableName}_${columns.join("_")}`;

    this.blueprint.indexes.push({
      fields: columns,
      name: name,
      type: "composite",
    });
    return this;
  }

  /**
   * Create a partial index with condition
   */
  partial(columns, condition, indexName = null) {
    const columnArray = Array.isArray(columns) ? columns : [columns];
    const name =
      indexName || `partial_${this.tableName}_${columnArray.join("_")}`;

    this.blueprint.indexes.push({
      fields: columnArray,
      name: name,
      where: condition,
      type: "partial",
    });
    return this;
  }

  /**
   * Drop an index
   */
  dropIndex(indexName) {
    this.blueprint.dropIndexes = this.blueprint.dropIndexes || [];
    this.blueprint.dropIndexes.push(indexName);
    return this;
  }
}

export default IndexBuilder;
