class TableNameResolver {
  /**
   * Convert model name to table name using Laravel conventions
   * Examples: User -> users, PostCategory -> post_categories
   */
  static modelToTable(modelName) {
    return this.pluralize(this.camelToSnake(modelName));
  }

  /**
   * Convert table name to model name
   * Examples: users -> User, post_categories -> PostCategory
   */
  static tableToModel(tableName) {
    return this.snakeToPascal(this.singularize(tableName));
  }

  /**
   * Convert camelCase to snake_case
   */
  static camelToSnake(str) {
    return str
      .replace(/([A-Z])/g, "_$1")
      .toLowerCase()
      .replace(/^_/, "");
  }

  /**
   * Convert snake_case to PascalCase
   */
  static snakeToPascal(str) {
    return str
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join("");
  }

  /**
   * Convert snake_case to camelCase
   */
  static snakeToCamel(str) {
    const pascal = this.snakeToPascal(str);
    return pascal.charAt(0).toLowerCase() + pascal.slice(1);
  }

  /**
   * Simple pluralization (can be extended with more rules)
   */
  static pluralize(word) {
    const irregulars = {
      person: "people",
      man: "men",
      woman: "women",
      child: "children",
      tooth: "teeth",
      foot: "feet",
      mouse: "mice",
      goose: "geese",
    };

    if (irregulars[word.toLowerCase()]) {
      return irregulars[word.toLowerCase()];
    }

    // Common rules
    if (word.endsWith("y") && !this.isVowel(word.charAt(word.length - 2))) {
      return word.slice(0, -1) + "ies";
    }

    if (
      word.endsWith("s") ||
      word.endsWith("sh") ||
      word.endsWith("ch") ||
      word.endsWith("x") ||
      word.endsWith("z")
    ) {
      return word + "es";
    }

    if (word.endsWith("f")) {
      return word.slice(0, -1) + "ves";
    }

    if (word.endsWith("fe")) {
      return word.slice(0, -2) + "ves";
    }

    return word + "s";
  }

  /**
   * Simple singularization
   */
  static singularize(word) {
    const irregulars = {
      people: "person",
      men: "man",
      women: "woman",
      children: "child",
      teeth: "tooth",
      feet: "foot",
      mice: "mouse",
      geese: "goose",
    };

    if (irregulars[word.toLowerCase()]) {
      return irregulars[word.toLowerCase()];
    }

    if (word.endsWith("ies")) {
      return word.slice(0, -3) + "y";
    }

    if (word.endsWith("ves")) {
      return word.slice(0, -3) + "f";
    }

    if (
      word.endsWith("ses") ||
      word.endsWith("shes") ||
      word.endsWith("ches") ||
      word.endsWith("xes") ||
      word.endsWith("zes")
    ) {
      return word.slice(0, -2);
    }

    if (word.endsWith("s") && word.length > 1) {
      return word.slice(0, -1);
    }

    return word;
  }

  /**
   * Check if character is a vowel
   */
  static isVowel(char) {
    return "aeiouAEIOU".includes(char);
  }

  /**
   * Generate foreign key column name
   * Examples: User -> user_id, PostCategory -> post_category_id
   */
  static foreignKey(modelName, suffix = "_id") {
    return this.camelToSnake(modelName) + suffix;
  }

  /**
   * Generate pivot table name for many-to-many relationships
   * Examples: User, Role -> role_users (alphabetical order)
   */
  static pivotTable(model1, model2) {
    const table1 = this.modelToTable(model1);
    const table2 = this.modelToTable(model2);

    // Sort alphabetically for consistency
    return [table1, table2].sort().join("_");
  }

  /**
   * Generate migration file name
   */
  static migrationName(action, tableName) {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 14);

    return `${timestamp}_${action}_${tableName}_table`;
  }

  /**
   * Generate seeder file name
   */
  static seederName(tableName) {
    const timestamp = new Date()
      .toISOString()
      .replace(/[-T:.Z]/g, "")
      .slice(0, 14);

    const modelName = this.tableToModel(tableName);
    return `${timestamp}_${modelName}Seeder`;
  }
}

export default TableNameResolver;
