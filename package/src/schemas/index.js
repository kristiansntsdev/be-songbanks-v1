import * as errors from "./errors/index.js";
import * as common from "./common/index.js";

export { errors, common };

// Export errors directly for convenience
export * from "./errors/index.js";
// Export common schemas directly for convenience
export * from "./common/index.js";

export default {
  errors,
  common,
  // Export errors directly for convenience
  ...errors,
  // Export common schemas directly for convenience
  ...common,
};
