const errors = require("./errors");
const common = require("./common");

module.exports = {
  errors,
  common,
  // Export errors directly for convenience
  ...errors,
  // Export common schemas directly for convenience
  ...common,
};
