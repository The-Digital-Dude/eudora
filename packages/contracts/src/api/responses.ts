import { z } from "zod";

export const apiErrorDetailSchema = z.record(z.string(), z.unknown()).optional();

export const responseMetaSchema = z.object({
  requestId: z.string().min(1),
  timestamp: z.string().datetime(),
  path: z.string().min(1),
  method: z.string().min(1),
  version: z.string().min(1),
  durationMs: z.number().nonnegative().optional()
});

export const apiErrorBodySchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  details: apiErrorDetailSchema
});

export const apiSuccessSchema = z.object({
  success: z.literal(true),
  data: z.unknown(),
  meta: responseMetaSchema
});

export const apiErrorSchema = z.object({
  success: z.literal(false),
  error: apiErrorBodySchema,
  meta: responseMetaSchema
});

export const apiResponseSchema = z.union([apiSuccessSchema, apiErrorSchema]);

export type ApiError = z.infer<typeof apiErrorBodySchema>;
export type ResponseMeta = z.infer<typeof responseMetaSchema>;

export type ApiResponse<T> =
  | {
      success: true;
      data: T;
      meta: ResponseMeta;
    }
  | {
      success: false;
      error: ApiError;
      meta: ResponseMeta;
    };

export function ok<T>(data: T, meta: ResponseMeta): ApiResponse<T> {
  return { success: true, data, meta };
}

export function fail(
  code: string,
  message: string,
  meta: ResponseMeta,
  details?: Record<string, unknown>
): ApiResponse<never> {
  return {
    success: false,
    error: details ? { code, message, details } : { code, message },
    meta
  };
}
