/**
 * Swagpress Framework - Compatibility index file
 * 
 * This file provides backward compatibility for services that import from 
 * "../../package/swagpress/index.js" while the main swagpress.js file handles
 * the actual module structure.
 */

// Re-export everything from the parent swagpress.js file
export * from "../swagpress.js";

// Also provide direct exports for exceptions that services commonly need
export {
  ValidationException,
  AuthenticationException,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ModelNotFoundException,
  AccountAccessDeniedException,
  DuplicateResourceException,
  ConflictException,
} from "../swagpress.js";