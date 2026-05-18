import { z } from "zod";

export const healthResponseSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  timestamp: z.string().datetime(),
  database: z.object({
    status: z.enum(["up", "down"]),
    latencyMs: z.number().nonnegative().nullable()
  }),
  service: z.object({
    name: z.string().min(1),
    version: z.string().min(1)
  })
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
