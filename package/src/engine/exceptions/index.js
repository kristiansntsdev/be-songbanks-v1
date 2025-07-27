// Base Exception
const BaseException = require("./BaseException");
const ValidationException = require("./ValidationException");

// HTTP Exceptions
const {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  TooManyRequestsException,
  InternalServerException,
} = require("./HttpExceptions");

// Application Exceptions
const {
  AuthenticationException,
  AccountAccessDeniedException,
  ModelNotFoundException,
  DuplicateResourceException,
} = require("./ApplicationExceptions");

// Framework Exceptions (existing ones)
const MigrationException = require("./MigrationException");
const SchemaException = require("./SchemaException");
const SeederException = require("./SeederException");

module.exports = {
  // Base
  BaseException,
  ValidationException,

  // HTTP
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  TooManyRequestsException,
  InternalServerException,

  // Application
  AuthenticationException,
  AccountAccessDeniedException,
  ModelNotFoundException,
  DuplicateResourceException,

  // Framework
  MigrationException,
  SchemaException,
  SeederException,
};
