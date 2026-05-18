import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PrismaService } from "@guidora/db";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppModule } from "../src/app.module";
import { configureApp, configureOpenApi } from "../src/main";

vi.hoisted(() => {
  process.env.DATABASE_URL = "postgresql://guidora:guidora@localhost:5432/guidora?schema=public";
  process.env.CONSOLE_ORIGIN = "http://localhost:3002";
  process.env.JWT_ACCESS_SECRET = "test-access-secret-that-is-long-enough-for-rbac";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret-that-is-long-enough-for-rbac";
});

describe("health API", () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(PrismaService)
      .useValue({
        $queryRaw: vi.fn().mockResolvedValue([{ value: 1 }])
      })
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    configureOpenApi(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it("returns a shared health response envelope", async () => {
    const response = await request(app.getHttpServer()).get("/health").expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe("ok");
    expect(response.body.data.database.status).toBe("up");
    expect(response.body.data.service.name).toBe("guidora-api");
    expect(response.body.meta).toEqual({
      requestId: expect.any(String),
      timestamp: expect.any(String),
      path: "/health",
      method: "GET",
      version: "v1",
      durationMs: expect.any(Number)
    });
  });

  it("returns a shared error response envelope", async () => {
    const response = await request(app.getHttpServer())
      .get("/missing")
      .expect(404);

    expect(response.body).toEqual({
      success: false,
      error: {
        code: "NOT_FOUND",
        message: "Cannot GET /missing"
      },
      meta: {
        requestId: expect.any(String),
        timestamp: expect.any(String),
        path: "/missing",
        method: "GET",
        version: "v1",
        durationMs: expect.any(Number)
      }
    });
  });

  it("serves OpenAPI documentation", async () => {
    await request(app.getHttpServer()).get("/docs").expect(200);
  });
});
