// Core classes
import Migration from "./core/Migration.js";
import Schema from "./core/Schema.js";
import Blueprint from "./core/Blueprint.js";
import Factory from "./core/Factory.js";
import Seeder from "./core/Seeder.js";
import BaseModel from "./core/BaseModel.js";
import ModelFactory from "./core/ModelFactory.js";

// Builders
import ColumnBuilder from "./builders/ColumnBuilder.js";
import IndexBuilder from "./builders/IndexBuilder.js";
import ForeignKeyBuilder from "./builders/ForeignKeyBuilder.js";
import ForeignIdBuilder from "./builders/ForeignIdBuilder.js";
import FactoryBuilder from "./builders/FactoryBuilder.js";

// Types
import StringTypes from "./types/StringTypes.js";
import NumericTypes from "./types/NumericTypes.js";
import DateTypes from "./types/DateTypes.js";
import SpecialTypes from "./types/SpecialTypes.js";
import FactoryTypes from "./types/FactoryTypes.js";

// Operations
import TableOperations from "./operations/TableOperations.js";
import SeederOperations from "./operations/SeederOperations.js";

// Utils
import TableNameResolver from "./utils/TableNameResolver.js";
import TypeMapper from "./utils/TypeMapper.js";

// Exceptions
import {
  BaseException,
  ValidationException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  TooManyRequestsException,
  InternalServerException,
  AuthenticationException,
  AccountAccessDeniedException,
  ModelNotFoundException,
  DuplicateResourceException,
  MigrationException,
  SchemaException,
  SeederException,
} from "./exceptions/index.js";

export {
  // Core exports
  Migration,
  Schema,
  Blueprint,
  Factory,
  Seeder,
  BaseModel,
  ModelFactory,

  // Builder exports
  ColumnBuilder,
  IndexBuilder,
  ForeignKeyBuilder,
  ForeignIdBuilder,
  FactoryBuilder,

  // Type exports
  StringTypes,
  NumericTypes,
  DateTypes,
  SpecialTypes,
  FactoryTypes,

  // Operation exports
  TableOperations,
  SeederOperations,

  // Utility exports
  TableNameResolver,
  TypeMapper,

  // Exception exports
  BaseException,
  ValidationException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  TooManyRequestsException,
  InternalServerException,
  AuthenticationException,
  AccountAccessDeniedException,
  ModelNotFoundException,
  DuplicateResourceException,
  MigrationException,
  SchemaException,
  SeederException,
};

// Convenience factory methods
export const createMigration = (queryInterface, Sequelize) => {
  return new Migration(queryInterface, Sequelize);
};

export const createSchema = (queryInterface, Sequelize) => {
  return new Schema(queryInterface, Sequelize);
};

export const createBlueprint = (tableName, queryInterface, Sequelize) => {
  return new Blueprint(tableName, queryInterface, Sequelize);
};

export const createFactory = (modelName, definition) => {
  return Factory.define(modelName, definition);
};

export const createSeeder = (queryInterface, Sequelize) => {
  return new Seeder(queryInterface, Sequelize);
};
