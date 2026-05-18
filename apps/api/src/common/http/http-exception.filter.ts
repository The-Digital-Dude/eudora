import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus
} from "@nestjs/common";
import { fail } from "@guidora/contracts";
import { RequestWithContext } from "./request-context";
import { createResponseMeta } from "./response-meta";

type ResponseWriter = {
  status(code: number): ResponseWriter;
  json(body: unknown): void;
};

type ExceptionResponseBody = {
  message?: string | string[];
  error?: string;
};

const statusCodeByHttpStatus: Record<number, string> = {
  [HttpStatus.BAD_REQUEST]: "BAD_REQUEST",
  [HttpStatus.UNAUTHORIZED]: "UNAUTHORIZED",
  [HttpStatus.FORBIDDEN]: "FORBIDDEN",
  [HttpStatus.NOT_FOUND]: "NOT_FOUND",
  [HttpStatus.CONFLICT]: "CONFLICT",
  [HttpStatus.UNPROCESSABLE_ENTITY]: "UNPROCESSABLE_ENTITY",
  [HttpStatus.TOO_MANY_REQUESTS]: "TOO_MANY_REQUESTS",
  [HttpStatus.INTERNAL_SERVER_ERROR]: "INTERNAL_SERVER_ERROR",
  [HttpStatus.SERVICE_UNAVAILABLE]: "SERVICE_UNAVAILABLE"
};

function normalizeMessage(message: string | string[] | undefined): string {
  if (Array.isArray(message)) {
    return message.join("; ");
  }

  return message ?? "Unexpected server error";
}

function getExceptionBody(exception: unknown): {
  status: number;
  code: string;
  message: string;
  details?: Record<string, unknown>;
} {
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const response = exception.getResponse();

    if (typeof response === "string") {
      return {
        status,
        code: statusCodeByHttpStatus[status] ?? "HTTP_ERROR",
        message: response
      };
    }

    const body = response as ExceptionResponseBody;
    const message = normalizeMessage(body.message);

    return {
      status,
      code: statusCodeByHttpStatus[status] ?? "HTTP_ERROR",
      message,
      details: Array.isArray(body.message) ? { messages: body.message } : undefined
    };
  }

  return {
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    code: "INTERNAL_SERVER_ERROR",
    message: "Unexpected server error"
  };
}

@Catch()
export class HttpExceptionEnvelopeFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<RequestWithContext>();
    const response = http.getResponse<ResponseWriter>();
    const body = getExceptionBody(exception);
    const envelope = fail(body.code, body.message, createResponseMeta(request), body.details);

    response.status(body.status).json(envelope);
  }
}
