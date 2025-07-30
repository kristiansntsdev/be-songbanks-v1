import { faker } from "@faker-js/faker";
import { ulid } from "ulid";

/**
 * FactoryTypes - Laravel-inspired factory data generators
 * Provides a clean API for generating realistic test data
 */
class FactoryTypes {
  // Personal Data
  static name() {
    return faker.person.fullName();
  }

  static firstName() {
    return faker.person.firstName();
  }

  static lastName() {
    return faker.person.lastName();
  }

  static email() {
    return faker.internet.email();
  }

  static uniqueEmail() {
    return `${faker.internet.userName()}.${Date.now()}@${faker.internet.domainName()}`;
  }

  static password(length = 8) {
    return faker.internet.password({ length });
  }

  static phoneNumber() {
    return faker.phone.number();
  }

  static username() {
    return faker.internet.userName();
  }

  // Location Data
  static address() {
    return faker.location.streetAddress();
  }

  static city() {
    return faker.location.city();
  }

  static country() {
    return faker.location.country();
  }

  static company() {
    return faker.company.name();
  }

  // Text Data
  static text(sentences = 3) {
    return faker.lorem.sentences(sentences);
  }

  static paragraph(sentences = 5) {
    return faker.lorem.paragraph(sentences);
  }

  static sentence(words = 6) {
    return faker.lorem.sentence(words);
  }

  static words(count = 3) {
    return faker.lorem.words(count);
  }

  static slug(words = 3) {
    return faker.lorem.slug(words);
  }

  // Numeric Data
  static integer(min = 1, max = 1000) {
    return faker.number.int({ min, max });
  }

  static float(min = 0, max = 100, precision = 2) {
    return faker.number.float({ min, max, precision });
  }

  static price(min = 10, max = 1000) {
    return faker.number.float({ min, max, precision: 0.01 });
  }

  static boolean() {
    return faker.datatype.boolean();
  }

  // Date Data
  static date(from = "1970-01-01", to = "2030-12-31") {
    return faker.date.between({ from, to });
  }

  static futureDate(years = 1) {
    return faker.date.future({ years });
  }

  static pastDate(years = 1) {
    return faker.date.past({ years });
  }

  static recentDate(days = 30) {
    return faker.date.recent({ days });
  }

  // Web Data
  static url() {
    return faker.internet.url();
  }

  static imageUrl(width = 640, height = 480) {
    return faker.image.url({ width, height });
  }

  static fileName(extension = "txt") {
    return `${faker.system.fileName()}.${extension}`;
  }

  // Unique Identifiers
  static uuid() {
    return faker.string.uuid();
  }

  static ulid() {
    return ulid();
  }

  // Visual Data
  static color() {
    return faker.color.rgb();
  }

  static hexColor() {
    return faker.color.rgb({ format: "hex" });
  }

  // Array Operations
  static randomElement(array) {
    if (!Array.isArray(array) || array.length === 0) {
      throw new Error("randomElement requires a non-empty array");
    }
    return faker.helpers.arrayElement(array);
  }

  static randomElements(array, count = 1) {
    if (!Array.isArray(array)) {
      throw new Error("randomElements requires an array");
    }
    return faker.helpers.arrayElements(array, count);
  }

  static enum(values) {
    return this.randomElement(values);
  }

  // Advanced Operations
  static sequence(callback) {
    let index = 0;
    return () => {
      const result = callback(index);
      index++;
      return result;
    };
  }

  static conditional(condition, trueValue, falseValue) {
    return condition ? trueValue : falseValue;
  }

  static computed(callback) {
    return callback;
  }

  static json(structure) {
    if (typeof structure === "function") {
      return structure();
    }

    const result = {};
    for (const [key, generator] of Object.entries(structure)) {
      if (typeof generator === "function") {
        result[key] = generator();
      } else {
        result[key] = generator;
      }
    }
    return JSON.stringify(result);
  }

  static nullable(generator, probability = 0.5) {
    return faker.datatype.boolean(probability)
      ? null
      : typeof generator === "function"
        ? generator()
        : generator;
  }

  static optional(generator, probability = 0.8) {
    return faker.datatype.boolean(probability)
      ? typeof generator === "function"
        ? generator()
        : generator
      : undefined;
  }

  // Generic category generators
  static category() {
    return this.randomElement([
      "Primary",
      "Secondary",
      "Featured",
      "Special",
      "Standard",
      "Premium",
      "Basic",
      "Advanced",
      "Popular",
      "Trending",
      "New",
      "Classic",
    ]);
  }

  static status() {
    return this.randomElement([
      "active",
      "inactive",
      "pending",
      "suspended",
      "archived",
    ]);
  }

  static priority() {
    return this.randomElement(["low", "medium", "high", "urgent", "critical"]);
  }

  static type() {
    return this.randomElement([
      "type_a",
      "type_b",
      "type_c",
      "standard",
      "custom",
    ]);
  }

  static role() {
    return this.randomElement([
      "admin",
      "user",
      "moderator",
      "guest",
      "member",
    ]);
  }

  static grade() {
    return this.randomElement(["A", "B", "C", "D", "F"]);
  }

  static rating() {
    return this.integer(1, 5);
  }

  static level() {
    return this.randomElement([
      "beginner",
      "intermediate",
      "advanced",
      "expert",
    ]);
  }

  // Common database patterns
  static timestamps() {
    return {
      created_at: this.pastDate(),
      updated_at: this.recentDate(),
    };
  }

  static softDeletes() {
    return {
      deleted_at: this.nullable(this.pastDate(), 0.1), // 10% chance of being soft deleted
    };
  }

  static auditFields() {
    return {
      created_by: this.integer(1, 100),
      updated_by: this.integer(1, 100),
      ...this.timestamps(),
    };
  }

  // Utility method to create a factory attribute that resolves at runtime
  static lazy(callback) {
    return () => callback();
  }

  // Method to create dependent attributes
  static dependent(dependencies, callback) {
    return function (attributes) {
      const deps = {};
      for (const dep of dependencies) {
        deps[dep] = attributes[dep];
      }
      return callback(deps, attributes);
    };
  }

  // Generic content generators
  static title() {
    return this.words(3)
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }

  static content() {
    return this.paragraph(3);
  }

  static shortDescription() {
    return this.sentence(8);
  }

  static longDescription() {
    return this.paragraph(5);
  }

  static tags(count = 3) {
    return Array.from({ length: count }, () => this.words(1)).join(",");
  }

  static metadata() {
    return {
      version: this.integer(1, 10),
      source: this.randomElement(["import", "manual", "api", "sync"]),
      flags: this.randomElements(["featured", "popular", "new", "updated"], 2),
    };
  }

  // Helper for creating references to other models
  static factory(factoryClass, state = null, attributes = {}) {
    const factory = factoryClass.new();
    if (state) {
      factory.state(state);
    }
    if (Object.keys(attributes).length > 0) {
      factory.state(attributes);
    }
    return factory;
  }

  // Helper for model references
  static belongsTo(factoryClass, state = null) {
    return this.factory(factoryClass, state);
  }

  // Helper for creating arrays of related models
  static hasMany(factoryClass, count = 3, state = null) {
    return this.factory(factoryClass, state).count(count);
  }
}

export default FactoryTypes;
