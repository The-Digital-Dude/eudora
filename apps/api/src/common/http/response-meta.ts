import { ResponseMeta } from "@guidora/contracts";
import {
  getRequestContext,
  getRequestPath,
  RequestWithContext
} from "./request-context";

export const API_VERSION = "v1";

export function createResponseMeta(request: RequestWithContext): ResponseMeta {
  const context = getRequestContext(request);

  return {
    requestId: context.requestId,
    timestamp: new Date().toISOString(),
    path: getRequestPath(request),
    method: request.method,
    version: API_VERSION,
    durationMs: Math.max(0, Date.now() - context.startedAt)
  };
}
