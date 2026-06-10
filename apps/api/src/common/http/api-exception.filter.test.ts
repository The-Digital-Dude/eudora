import { type ArgumentsHost } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { ApiExceptionFilter } from "./api-exception.filter.js";

function createHost(exceptionPath = "/api/assessment-types") {
  const json = vi.fn();
  const status = vi.fn(() => ({ json }));
  const request = {
    headers: {},
    method: "POST",
    originalUrl: exceptionPath
  };
  const response = {
    setHeader: vi.fn(),
    status
  };
  const host = {
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response
    })
  } as ArgumentsHost;

  return { host, json, request, response, status };
}

describe("ApiExceptionFilter", () => {
  it("maps Prisma unique constraint errors to 409 conflict with field details", () => {
    const filter = new ApiExceptionFilter();
    const { host, json, status } = createHost();

    filter.catch(
      {
        name: "PrismaClientKnownRequestError",
        code: "P2002",
        clientVersion: "7.8.0",
        meta: { target: ["code"] }
      },
      host
    );

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        code: "CONFLICT",
        message: "A record with this code already exists",
        errors: [
          {
            code: "CONFLICT",
            field: "code",
            message: "code must be unique"
          }
        ]
      })
    );
  });

  it("maps Prisma missing records and foreign key errors to useful client errors", () => {
    const filter = new ApiExceptionFilter();
    const missing = createHost();
    const foreignKey = createHost();

    filter.catch(
      { name: "PrismaClientKnownRequestError", code: "P2025", clientVersion: "7.8.0" },
      missing.host
    );
    filter.catch(
      { name: "PrismaClientKnownRequestError", code: "P2003", clientVersion: "7.8.0" },
      foreignKey.host
    );

    expect(missing.status).toHaveBeenCalledWith(404);
    expect(missing.json).toHaveBeenCalledWith(expect.objectContaining({ code: "NOT_FOUND", message: "Record not found" }));
    expect(foreignKey.status).toHaveBeenCalledWith(400);
    expect(foreignKey.json).toHaveBeenCalledWith(
      expect.objectContaining({ code: "BAD_REQUEST", message: "Referenced record does not exist" })
    );
  });
});
