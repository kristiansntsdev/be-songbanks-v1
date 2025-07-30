// Base Exception
import BaseException from "./BaseException.js";
import ValidationException from "./ValidationException.js";

// HTTP Exceptions
import {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  TooManyRequestsException,
  InternalServerException,
} from "./HttpExceptions.js";

// Application Exceptions
import {
  AuthenticationException,
  AccountAccessDeniedException,
  ModelNotFoundException,
  DuplicateResourceException,
} from "./ApplicationExceptions.js";

// Framework Exceptions (existing ones)
import MigrationException from "./MigrationException.js";
import SchemaException from "./SchemaException.js";
import SeederException from "./SeederException.js";

export {
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
