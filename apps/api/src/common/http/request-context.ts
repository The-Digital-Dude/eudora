import { randomUUID } from "node:crypto";
import { Injectable, NestMiddleware } from "@nestjs/common";

export type RequestContext = {
  requestId: string;
  startedAt: number;
};

export type RequestWithContext = {
  method: string;
  originalUrl?: string;
  url?: string;
  headers: Record<string, string | string[] | undefined>;
  guidoraContext?: RequestContext;
};

export type ResponseWithHeaders = {
  setHeader(name: string, value: string): void;
};

function readRequestId(header: string | string[] | undefined): string {
  if (Array.isArray(header)) {
    return header[0] ?? randomUUID();
  }

  return header?.trim() || randomUUID();
}

export function getRequestPath(request: RequestWithContext): string {
  return request.originalUrl ?? request.url ?? "/";
}

export function getRequestContext(request: RequestWithContext): RequestContext {
  if (!request.guidoraContext) {
    request.guidoraContext = {
      requestId: readRequestId(request.headers["x-request-id"]),
      startedAt: Date.now()
    };
  }

  return request.guidoraContext;
}

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(
    request: RequestWithContext,
    response: ResponseWithHeaders,
    next: () => void
  ): void {
    const context = getRequestContext(request);
    response.setHeader("x-request-id", context.requestId);
    next();
  }
}
