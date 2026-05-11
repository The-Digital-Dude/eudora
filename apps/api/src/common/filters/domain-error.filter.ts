import type { ArgumentsHost, ExceptionFilter } from "@nestjs/common";
import { Catch, HttpException, HttpStatus } from "@nestjs/common";
import { ERROR_CODES, type ApiFailure } from "@guidora/contracts";
import { DomainError } from "../errors/domain-errors";

@Catch()
export class DomainErrorFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const context = host.switchToHttp();
    const response = context.getResponse();
    const request = context.getRequest<{ requestId?: string }>();

    if (exception instanceof DomainError) {
      const body: ApiFailure = {
        error: {
          code: exception.code,
          message: exception.message,
          details: exception.details,
          requestId: request.requestId
        }
      };

      response.status(exception.statusCode).json(body);
      return;
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const body: ApiFailure = {
        error: {
          code: status === HttpStatus.NOT_FOUND ? ERROR_CODES.NOT_FOUND : ERROR_CODES.INTERNAL_ERROR,
          message: exception.message,
          requestId: request.requestId
        }
      };

      response.status(status).json(body);
      return;
    }

    const body: ApiFailure = {
      error: {
        code: ERROR_CODES.INTERNAL_ERROR,
        message: "An unexpected error occurred.",
        requestId: request.requestId
      }
    };

    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(body);
  }
}
