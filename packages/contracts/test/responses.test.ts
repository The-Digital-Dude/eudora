import { describe, expect, it } from "vitest";
import {
  apiErrorSchema,
  apiSuccessSchema,
  healthResponseSchema,
  responseMetaSchema,
  ok,
  fail
} from "../src";

const meta = {
  requestId: "req_01HV0000000000000000000000",
  timestamp: "2026-05-16T00:00:00.000Z",
  path: "/health",
  method: "GET",
  version: "v1",
  durationMs: 12
};

describe("contract response helpers", () => {
  it("validates shared response metadata", () => {
    expect(responseMetaSchema.parse(meta)).toEqual(meta);
  });

  it("wraps successful payloads in the shared response envelope", () => {
    const response = ok({ value: "ready" }, meta);

    expect(apiSuccessSchema.parse(response)).toEqual({
      success: true,
      data: { value: "ready" },
      meta
    });
  });

  it("wraps errors in the shared response envelope", () => {
    const response = fail("DATABASE_UNAVAILABLE", "Database is not reachable", meta);

    expect(apiErrorSchema.parse(response)).toEqual({
      success: false,
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "Database is not reachable"
      },
      meta
    });
  });

  it("validates the API health response shape", () => {
    const health = {
      status: "ok",
      timestamp: "2026-05-16T00:00:00.000Z",
      database: {
        status: "up",
        latencyMs: 12
      },
      service: {
        name: "guidora-api",
        version: "0.0.0"
      }
    };

    expect(healthResponseSchema.parse(health)).toEqual(health);
  });
});
