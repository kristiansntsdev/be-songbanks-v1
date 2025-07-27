const fs = require("fs");
const path = require("path");

class BaseGenerator {
  constructor() {
    this.stubsPath = path.join(__dirname, "../stubs");
  }

  /**
   * Load a template file
   * @param {string} templateName
   * @returns {string}
   */
  loadTemplate(templateName) {
    const templatePath = path.join(this.stubsPath, templateName);
    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templatePath}`);
    }
    return fs.readFileSync(templatePath, "utf8");
  }

  /**
   * Ensure directory exists
   * @param {string} dirPath
   */
  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Replace template placeholders
   * @param {string} template
   * @param {object} replacements
   * @returns {string}
   */
  replaceTemplate(template, replacements) {
    let content = template;
    for (const [key, value] of Object.entries(replacements)) {
      content = content.replace(new RegExp(`{{${key}}}`, "g"), value);
    }
    return content;
  }

  /**
   * Write file with content
   * @param {string} filePath
   * @param {string} content
   */
  writeFile(filePath, content) {
    this.ensureDirectoryExists(path.dirname(filePath));
    fs.writeFileSync(filePath, content);
  }

  /**
   * Check if file exists
   * @param {string} filePath
   * @returns {boolean}
   */
  fileExists(filePath) {
    return fs.existsSync(filePath);
  }

  /**
   * Get table name from model name
   * @param {string} modelName
   * @returns {string}
   */
  getTableName(modelName) {
    return (
      modelName
        .replace(/([A-Z])/g, "_$1")
        .toLowerCase()
        .replace(/^_/, "") + "s"
    );
  }

  /**
   * Pluralize a word
   * @param {string} word
   * @returns {string}
   */
  pluralize(word) {
    if (word.endsWith("y")) {
      return word.slice(0, -1) + "ies";
    } else if (
      word.endsWith("s") ||
      word.endsWith("sh") ||
      word.endsWith("ch") ||
      word.endsWith("x") ||
      word.endsWith("z")
    ) {
      return word + "es";
    } else {
      return word + "s";
    }
  }

  /**
   * Capitalize first letter
   * @param {string} word
   * @returns {string}
   */
  capitalize(word) {
    return word.charAt(0).toUpperCase() + word.slice(1);
  }

  /**
   * Convert to camelCase
   * @param {string} str
   * @returns {string}
   */
  toCamelCase(str) {
    return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
  }

  /**
   * Convert to snake_case
   * @param {string} str
   * @returns {string}
   */
  toSnakeCase(str) {
    return str
      .replace(/([A-Z])/g, "_$1")
      .toLowerCase()
      .replace(/^_/, "");
  }
}

module.exports = BaseGenerator;
