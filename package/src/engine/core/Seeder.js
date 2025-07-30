import SeederOperations from "../operations/SeederOperations.js";
import SeederException from "../exceptions/SeederException.js";
import { setTimeout } from "timers/promises";
import { ulid } from "ulid";

class Seeder {
  constructor(queryInterface, Sequelize) {
    this.queryInterface = queryInterface;
    this.Sequelize = Sequelize;
    this.factories = new Map();
    this.operations = new SeederOperations(queryInterface, Sequelize);

    // Default configuration
    this.config = {
      autoHandleDuplicates: true,
      defaultUniqueFields: ["email", "name", "slug"],
      onDuplicate: "skip", // 'skip', 'update', 'error'
      batchSize: 100,
      stopOnError: false,
    };
  }

  /**
   * Run the database seeders
   * Override this method in your seeder classes
   */
  async run() {
    throw new Error("run() method must be implemented in seeder class");
  }

  /**
   * Execute the seeder
   */
  async execute() {
    console.log(`🌱 Running seeder: ${this.constructor.name}`);
    const startTime = Date.now();

    try {
      await this.run();
      const duration = Date.now() - startTime;
      console.log(`✅ Seeder completed in ${duration}ms`);
    } catch (error) {
      console.error(`❌ Seeder failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Register a factory
   */
  factory(modelName, definition) {
    this.factories.set(modelName, definition);
    return this;
  }

  /**
   * Get a factory instance for a model
   */
  async getFactory(modelName) {
    const { default: Factory } = await import("./Factory.js");
    const definition = this.factories.get(modelName);

    if (!definition) {
      throw new Error(`Factory for model '${modelName}' not found`);
    }

    // Create factory with enhanced capabilities for Sequelize
    const factory = Factory.define(modelName, definition);

    // Override saveModelInstance to work with Sequelize and auto-handle duplicates
    factory.saveModelInstance = async (instance) => {
      const tableName = await this.getTableName(modelName);
      // Add ID if not present
      if (!instance.id) {
        instance.id = ulid();
      }

      // Add timestamps
      const now = new Date();
      instance.createdAt = instance.createdAt || now;
      instance.updatedAt = instance.updatedAt || now;

      // Use seeder operations for automatic duplicate handling
      if (this.config.autoHandleDuplicates) {
        const results = await this.operations.safeInsert(tableName, instance, {
          uniqueFields: this.config.defaultUniqueFields,
          onDuplicate: this.config.onDuplicate,
          stopOnError: this.config.stopOnError,
        });

        if (results.inserted.length > 0) {
          return results.inserted[0];
        } else if (results.skipped.length > 0) {
          console.log(
            `⚠️  Factory instance skipped (duplicate): ${JSON.stringify(results.skipped[0].record)}`
          );
          return results.skipped[0].existing;
        } else if (results.updated.length > 0) {
          return results.updated[0].record;
        }
      } else {
        // Original behavior - direct insertion
        await this.queryInterface.bulkInsert(tableName, [instance]);
      }

      return instance;
    };

    return factory;
  }

  /**
   * Create factory instances with fluent syntax
   */
  create(modelName) {
    return new SeederBuilder(this, modelName);
  }

  /**
   * Configure seeder behavior
   */
  configure(options) {
    this.config = { ...this.config, ...options };
    return this;
  }

  /**
   * Insert data directly into table with automatic duplicate handling
   */
  async insert(tableName, data, options = {}) {
    const finalOptions = {
      uniqueFields: this.config.defaultUniqueFields,
      onDuplicate: this.config.onDuplicate,
      batchSize: this.config.batchSize,
      stopOnError: this.config.stopOnError,
      ...options,
    };

    if (this.config.autoHandleDuplicates) {
      const results = await this.operations.safeInsert(
        tableName,
        data,
        finalOptions
      );

      console.log(`📦 Seeding results for ${tableName}:`);
      console.log(`   ✅ Inserted: ${results.inserted.length}`);
      if (results.skipped.length > 0) {
        console.log(`   ⚠️  Skipped: ${results.skipped.length} (duplicates)`);
      }
      if (results.updated.length > 0) {
        console.log(`   🔄 Updated: ${results.updated.length}`);
      }
      if (results.errors.length > 0) {
        console.log(`   ❌ Errors: ${results.errors.length}`);
        results.errors.forEach((error) => {
          console.error(`      Error: ${error.error}`);
        });
      }

      return results;
    } else {
      // Original behavior - direct insertion
      const records = Array.isArray(data) ? data : [data];

      const timestamp = new Date();
      const processedRecords = records.map((record) => ({
        ...record,
        createdAt: record.createdAt || timestamp,
        updatedAt: record.updatedAt || timestamp,
      }));

      await this.queryInterface.bulkInsert(tableName, processedRecords);
      console.log(
        `📦 Inserted ${processedRecords.length} records into ${tableName}`
      );

      return {
        inserted: processedRecords,
        skipped: [],
        updated: [],
        errors: [],
      };
    }
  }

  /**
   * Insert only if records don't exist (upsert with skip on duplicate)
   */
  async insertIfNotExists(
    tableName,
    data,
    uniqueFields = this.config.defaultUniqueFields
  ) {
    return await this.operations.insertIfNotExists(
      tableName,
      data,
      uniqueFields
    );
  }

  /**
   * Upsert data (insert or update existing)
   */
  async upsert(
    tableName,
    data,
    uniqueFields = this.config.defaultUniqueFields
  ) {
    return await this.operations.upsert(tableName, data, uniqueFields);
  }

  /**
   * Delete all data from table
   */
  async truncate(tableName) {
    await this.queryInterface.bulkDelete(tableName, null, {});
    console.log(`🗑️  Truncated table: ${tableName}`);
  }

  /**
   * Call another seeder
   */
  async call(SeederClass) {
    const seeder = new SeederClass(this.queryInterface, this.Sequelize);
    await seeder.execute();
  }

  /**
   * Get model instance (if using Sequelize models)
   */
  model(modelName) {
    // This would be implemented based on your model loading strategy
    // For now, return a mock that works with the factory system
    return {
      name: modelName,
      create: async (attributes) => {
        const tableName = await this.getTableName(modelName);
        const records = await this.insert(tableName, attributes);
        return Array.isArray(records) ? records[0] : records;
      },
      bulkCreate: async (attributesArray) => {
        const tableName = await this.getTableName(modelName);
        return await this.insert(tableName, attributesArray);
      },
    };
  }

  /**
   * Convert model name to table name
   */
  async getTableName(modelName) {
    const { default: TableNameResolver } = await import(
      "../utils/TableNameResolver.js"
    );
    return TableNameResolver.modelToTable(modelName);
  }

  /**
   * Generate fake data using faker
   */
  async fake() {
    const { default: Factory } = await import("./Factory.js");
    return Factory.fake();
  }

  /**
   * Create a progress indicator for large seeding operations
   */
  progress(total, label = "Seeding") {
    let current = 0;
    return {
      increment: () => {
        current++;
        const percentage = Math.round((current / total) * 100);
        process.stdout.write(
          `\r${label}: ${current}/${total} (${percentage}%)`
        );
        if (current === total) {
          console.log(""); // New line when complete
        }
      },
    };
  }

  /**
   * Batch processing for large datasets
   */
  async batch(items, batchSize, processor) {
    const results = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await processor(batch, i / batchSize + 1);
      results.push(
        ...(Array.isArray(batchResults) ? batchResults : [batchResults])
      );

      // Small delay to prevent overwhelming the database
      if (i + batchSize < items.length) {
        await setTimeout(10);
      }
    }

    return results;
  }
}

/**
 * Fluent builder for seeder operations
 */
class SeederBuilder {
  constructor(seeder, modelName) {
    this.seeder = seeder;
    this.modelName = modelName;
    this.factoryCount = 1;
    this.factoryStates = [];
    this.relationships = [];
  }

  /**
   * Set the number of records to create
   */
  count(number) {
    this.factoryCount = number;
    return this;
  }

  /**
   * Apply a state to the factory
   */
  state(state) {
    this.factoryStates.push(state);
    return this;
  }

  /**
   * Add relationships
   */
  has(relationship, count = 1) {
    this.relationships.push({ name: relationship, count });
    return this;
  }

  /**
   * Create the records
   */
  async create(overrides = {}) {
    try {
      const factory = await this.seeder.getFactory(this.modelName);

      let factoryInstance = factory.count(this.factoryCount);

      // Apply states
      for (const state of this.factoryStates) {
        factoryInstance = factoryInstance.state(state);
      }

      // Apply relationships
      for (const relationship of this.relationships) {
        factoryInstance = factoryInstance.has(
          relationship.name,
          relationship.count
        );
      }

      return await factoryInstance.create(overrides);
    } catch (error) {
      if (error.message.includes("Factory for model")) {
        // If factory not found, use direct model creation
        const model = this.seeder.model(this.modelName);
        const records = [];

        for (let i = 0; i < this.factoryCount; i++) {
          const record = await model.create(overrides);
          records.push(record);
        }

        return this.factoryCount === 1 ? records[0] : records;
      }
      throw error;
    }
  }
}

export default Seeder;
