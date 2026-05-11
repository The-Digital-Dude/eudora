import { ERROR_CODES, type ErrorCode } from "@guidora/contracts";

const statusByCode: Record<ErrorCode, number> = {
  [ERROR_CODES.AUTHENTICATION_REQUIRED]: 401,
  [ERROR_CODES.AUTHENTICATED_USER_NOT_LINKED]: 401,
  [ERROR_CODES.USER_DISABLED]: 403,
  [ERROR_CODES.FORBIDDEN]: 403,
  [ERROR_CODES.VALIDATION_ERROR]: 400,
  [ERROR_CODES.NOT_FOUND]: 404,
  [ERROR_CODES.CONFLICT]: 409,
  [ERROR_CODES.ILLEGAL_STATE_TRANSITION]: 409,
  [ERROR_CODES.IDEMPOTENCY_CONFLICT]: 409,
  [ERROR_CODES.PROVIDER_ERROR]: 502,
  [ERROR_CODES.INTERNAL_ERROR]: 500
};

export class DomainError extends Error {
  readonly statusCode: number;

  constructor(
    readonly code: ErrorCode,
    message: string,
    readonly details?: unknown
  ) {
    super(message);
    this.name = "DomainError";
    this.statusCode = statusByCode[code];
  }
}

export function authenticationRequired() {
  return new DomainError(ERROR_CODES.AUTHENTICATION_REQUIRED, "Authentication is required.");
}

export function forbidden(message = "You do not have permission to perform this action.") {
  return new DomainError(ERROR_CODES.FORBIDDEN, message);
}

export function validationFailed(details: unknown) {
  return new DomainError(ERROR_CODES.VALIDATION_ERROR, "Request validation failed.", details);
}
