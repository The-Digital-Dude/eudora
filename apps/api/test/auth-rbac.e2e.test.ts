import { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { PERMISSIONS } from "@guidora/contracts";
import { PrismaService } from "@guidora/db";
import request from "supertest";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AppModule } from "../src/app.module";
import { hashPassword } from "../src/auth/password";
import { configureApp } from "../src/main";

vi.hoisted(() => {
  process.env.NODE_ENV = "test";
  process.env.DATABASE_URL = "postgresql://guidora:guidora@localhost:5432/guidora?schema=public";
  process.env.CONSOLE_ORIGIN = "http://localhost:3002";
  process.env.JWT_ACCESS_SECRET = "test-access-secret-that-is-long-enough-for-rbac";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret-that-is-long-enough-for-rbac";
});

function createRole(key: "OWNER" | "ADMIN" | "MEMBER", permissions: string[]) {
  return {
    id: `role_${key.toLowerCase()}`,
    key,
    name: key[0] + key.slice(1).toLowerCase(),
    permissions: permissions.map((permissionKey) => ({
      permission: {
        key: permissionKey,
        label: permissionKey,
        category: permissionKey.split(":")[0]
      }
    }))
  };
}

describe("auth and RBAC API", () => {
  let app: INestApplication;
  let owner: Record<string, unknown>;
  let member: Record<string, unknown>;
  const refreshTokens: Record<string, unknown>[] = [];

  beforeEach(async () => {
    const ownerRole = createRole("OWNER", [
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.USERS_READ,
      PERMISSIONS.USERS_CREATE,
      PERMISSIONS.USERS_UPDATE,
      PERMISSIONS.USERS_DISABLE,
      PERMISSIONS.USERS_RESET_PASSWORD,
      PERMISSIONS.USERS_MANAGE_OWNER
    ]);
    const memberRole = createRole("MEMBER", [
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.SETTINGS_READ,
      PERMISSIONS.SETTINGS_UPDATE_OWN
    ]);

    owner = {
      id: "usr_owner",
      email: "owner@guidora.local",
      name: "Guidora Owner",
      passwordHash: await hashPassword("password123"),
      status: "ACTIVE",
      roleId: ownerRole.id,
      role: ownerRole,
      lastLoginAt: null,
      createdAt: new Date("2026-05-16T00:00:00.000Z"),
      updatedAt: new Date("2026-05-16T00:00:00.000Z")
    };
    member = {
      id: "usr_member",
      email: "member@guidora.local",
      name: "Guidora Member",
      passwordHash: await hashPassword("password123"),
      status: "ACTIVE",
      roleId: memberRole.id,
      role: memberRole,
      lastLoginAt: null,
      createdAt: new Date("2026-05-16T00:00:00.000Z"),
      updatedAt: new Date("2026-05-16T00:00:00.000Z")
    };

    const prisma = {
      user: {
        findUnique: vi.fn(async ({ where }: { where: { email?: string; id?: string } }) => {
          if (where.email === owner.email || where.id === owner.id) return owner;
          if (where.email === member.email || where.id === member.id) return member;
          return null;
        }),
        findMany: vi.fn(async () => [owner, member]),
        update: vi.fn(async ({ where }: { where: { id: string } }) => {
          return where.id === owner.id ? owner : member;
        })
      },
      refreshToken: {
        create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => {
          refreshTokens.push(data);
          return { id: "rt_1", ...data };
        }),
        updateMany: vi.fn(async () => ({ count: 1 })),
        findFirst: vi.fn(async () => null)
      }
    };

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideProvider(PrismaService)
      .useValue(prisma)
      .compile();

    app = moduleRef.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
    refreshTokens.length = 0;
  });

  it("logs in an active user, sets auth cookies, and returns current user permissions", async () => {
    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "owner@guidora.local", password: "password123" })
      .expect(200);

    expect(response.headers["set-cookie"].join(";")).toContain("guidora_access=");
    expect(response.headers["set-cookie"].join(";")).toContain("guidora_refresh=");
    expect(response.body.success).toBe(true);
    expect(response.body.data.user).toMatchObject({
      id: "usr_owner",
      email: "owner@guidora.local",
      role: {
        key: "OWNER"
      },
      permissions: expect.arrayContaining([PERMISSIONS.USERS_CREATE])
    });
  });

  it("requires authentication before reading users", async () => {
    const response = await request(app.getHttpServer()).get("/users").expect(401);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: "UNAUTHORIZED"
      }
    });
  });

  it("forbids authenticated users without the required permission", async () => {
    const login = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "member@guidora.local", password: "password123" })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get("/users")
      .set("Cookie", login.headers["set-cookie"])
      .expect(403);

    expect(response.body).toMatchObject({
      success: false,
      error: {
        code: "FORBIDDEN"
      }
    });
  });

  it("allows users with users:read to list users", async () => {
    const login = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email: "owner@guidora.local", password: "password123" })
      .expect(200);

    const response = await request(app.getHttpServer())
      .get("/users")
      .set("Cookie", login.headers["set-cookie"])
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.items).toHaveLength(2);
    expect(response.body.data.items[0]).toMatchObject({
      email: "owner@guidora.local",
      role: {
        key: "OWNER"
      }
    });
  });
});
