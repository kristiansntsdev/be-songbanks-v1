import BaseException from "./BaseException.js";

// Common HTTP Exception Classes
class BadRequestException extends BaseException {
  constructor(message = "Bad request") {
    super(message, 400, "Bad Request");
  }
}

class UnauthorizedException extends BaseException {
  constructor(message = "Unauthorized") {
    super(message, 401, "Unauthorized");
  }
}

class ForbiddenException extends BaseException {
  constructor(message = "Forbidden") {
    super(message, 403, "Forbidden");
  }
}

class NotFoundException extends BaseException {
  constructor(message = "Not found") {
    super(message, 404, "Not Found");
  }
}

class ConflictException extends BaseException {
  constructor(message = "Conflict") {
    super(message, 409, "Conflict");
  }
}

class TooManyRequestsException extends BaseException {
  constructor(message = "Too many requests") {
    super(message, 429, "Too Many Requests");
  }
}

class InternalServerException extends BaseException {
  constructor(message = "Internal server error") {
    super(message, 500, "Internal Server Error");
  }
}

export {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  TooManyRequestsException,
  InternalServerException,
};
