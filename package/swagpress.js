/**
 * Swagpress Framework - Main entry point
 *
 * This file provides easy access to all Swagpress framework features.
 * Import this file to get access to all exceptions, models, and utilities.
 */

// Re-export everything from the engine
export * from "./src/engine/index.js";

// Export schemas for swagger documentation
import * as schemas from "./src/schemas/index.js";
export { schemas };

// Export engine as default for compatibility
import engine from "./src/engine/index.js";
export default engine;
