import {
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
} from "./HttpExceptions.js";

// Application-specific Exceptions
class AuthenticationException extends UnauthorizedException {
  constructor(message = "Invalid credentials") {
    super(message);
    this.errorType = "Authentication Failed";
  }
}

class AccountAccessDeniedException extends ForbiddenException {
  constructor(status = "inactive") {
    super(`Your account status is ${status}. Please contact administrator.`);
    this.errorType = "Account Access Denied";
  }

  toSwagpressResponse() {
    return {
      code: this.statusCode,
      message: "Account access denied",
      error: this.message,
    };
  }
}

class ModelNotFoundException extends NotFoundException {
  constructor(model, id = null) {
    const message = id
      ? `${model} with ID ${id} not found`
      : `${model} not found`;
    super(message);
    this.model = model;
    this.id = id;
  }
}

class DuplicateResourceException extends ConflictException {
  constructor(resource, field = null) {
    const message = field
      ? `${resource} with this ${field} already exists`
      : `${resource} already exists`;
    super(message);
    this.resource = resource;
    this.field = field;
  }
}

export {
  AuthenticationException,
  AccountAccessDeniedException,
  ModelNotFoundException,
  DuplicateResourceException,
};
