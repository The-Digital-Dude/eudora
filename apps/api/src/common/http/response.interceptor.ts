import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor
} from "@nestjs/common";
import { ApiResponse, ok } from "@guidora/contracts";
import { Observable, map } from "rxjs";
import { RequestWithContext } from "./request-context";
import { createResponseMeta } from "./response-meta";

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  if (!value || typeof value !== "object") {
    return false;
  }

  const maybeResponse = value as Partial<ApiResponse<unknown>>;
  return maybeResponse.success === true || maybeResponse.success === false;
}

@Injectable()
export class ResponseEnvelopeInterceptor implements NestInterceptor {
  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<ApiResponse<unknown>> {
    const request = context.switchToHttp().getRequest<RequestWithContext>();

    return next.handle().pipe(
      map((data: unknown) => {
        const meta = createResponseMeta(request);

        if (isApiResponse(data)) {
          return {
            ...data,
            meta
          };
        }

        return ok(data, meta);
      })
    );
  }
}
