/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { ConflictException, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SYSTEM_PERMISSIONS } from "./auth.constants.js";
import { AuthService } from "./auth.service.js";
import { JwtService } from "./jwt.service.js";
import { PasswordService } from "./password.service.js";

function createPrismaMock() {
  return {
    db: {
      user: {
        create: vi.fn(),
        findUnique: vi.fn(),
        findFirst: vi.fn(),
        update: vi.fn()
      },
      role: {
        upsert: vi.fn(),
        findUnique: vi.fn()
      },
      permission: {
        upsert: vi.fn()
      },
      userRole: {
        create: vi.fn()
      },
      authSession: {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn()
      },
      auditLog: {
        create: vi.fn()
      },
      $transaction: vi.fn(async (callback: (tx: unknown) => Promise<unknown>) => callback(createPrismaMock().db))
    }
  };
}

describe("AuthService", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("creates public signup accounts as pending verification with a hashed password", async () => {
    const prisma = createPrismaMock();
    prisma.db.user.findUnique.mockResolvedValue(null);
    prisma.db.user.create.mockResolvedValue({
      id: "user_1",
      email: "new@example.com",
      name: "New User",
      status: "pending_verification",
      mustChangePassword: false
    });

    const service = new AuthService(prisma as never, new PasswordService(), new JwtService());

    const user = await service.signup({
      email: " New@Example.com ",
      password: "Correct Horse Battery Staple",
      name: "New User"
    });

    expect(user).toMatchObject({
      id: "user_1",
      email: "new@example.com",
      status: "pending_verification"
    });
    expect(prisma.db.user.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: "new@example.com",
        name: "New User",
        status: "pending_verification",
        mustChangePassword: false,
        passwordHash: expect.not.stringContaining("Correct Horse Battery Staple")
      }),
      select: expect.any(Object)
    });
    expect(prisma.db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        event: "auth.signup.created",
        targetType: "user",
        targetId: "user_1"
      })
    });
  });

  it("rejects duplicate public signups with a conflict", async () => {
    const prisma = createPrismaMock();
    prisma.db.user.findUnique.mockResolvedValue({ id: "user_1" });

    const service = new AuthService(prisma as never, new PasswordService(), new JwtService());

    await expect(
      service.signup({
        email: "existing@example.com",
        password: "Correct Horse Battery Staple"
      })
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.db.user.create).not.toHaveBeenCalled();
  });

  it("rejects login for pending accounts", async () => {
    const prisma = createPrismaMock();
    prisma.db.user.findUnique.mockResolvedValue({
      id: "user_1",
      email: "pending@example.com",
      passwordHash: await new PasswordService().hash("password12345"),
      status: "pending_verification",
      failedLoginCount: 0,
      lockedUntil: null,
      mustChangePassword: false
    });

    const service = new AuthService(prisma as never, new PasswordService(), new JwtService());

    await expect(
      service.login({
        email: "pending@example.com",
        password: "password12345",
        userAgent: "vitest",
        ipAddress: "127.0.0.1"
      })
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.db.authSession.create).not.toHaveBeenCalled();
    expect(prisma.db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: "user_1",
        event: "auth.login.rejected_status"
      })
    });
  });

  it("uses environment-configured token lifetimes when creating login sessions", async () => {
    process.env.ACCESS_TOKEN_EXPIRES_IN_SECONDS = "120";
    process.env.REFRESH_TOKEN_EXPIRES_IN_SECONDS = "360";

    const prisma = createPrismaMock();
    const passwordService = new PasswordService();
    const jwtService = new JwtService();
    const passwordHash = await passwordService.hash("password12345");
    prisma.db.user.findUnique.mockResolvedValue({
      id: "user_1",
      email: "active@example.com",
      name: "Active User",
      passwordHash,
      status: "active",
      failedLoginCount: 0,
      lockedUntil: null,
      mustChangePassword: false
    });
    prisma.db.user.update.mockResolvedValue({
      id: "user_1",
      email: "active@example.com",
      name: "Active User",
      status: "active",
      mustChangePassword: false
    });

    const service = new AuthService(prisma as never, passwordService, jwtService);

    const result = await service.login({
      email: "active@example.com",
      password: "password12345",
      userAgent: "vitest",
      ipAddress: "127.0.0.1"
    });

    const accessPayload = jwtService.verify(result.tokens.accessToken);
    const refreshPayload = jwtService.verify(result.tokens.refreshToken);

    expect(result.tokens.accessTokenExpiresInSeconds).toBe(120);
    expect(result.tokens.refreshTokenExpiresInSeconds).toBe(360);
    expect(Number(accessPayload.exp) - Number(accessPayload.iat)).toBe(120);
    expect(Number(refreshPayload.exp) - Number(refreshPayload.iat)).toBe(360);
    expect(prisma.db.authSession.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        expiresAt: expect.any(Date),
        refreshTokenHash: expect.any(String),
        userId: "user_1"
      })
    });
  });

  it("bootstraps the first superadmin when enabled and protected by the bootstrap secret", async () => {
    process.env.BOOTSTRAP_SUPERADMIN_ENABLED = "true";
    process.env.BOOTSTRAP_SECRET = "bootstrap-secret";

    const prisma = createPrismaMock();
    const tx = createPrismaMock().db;
    prisma.db.$transaction.mockImplementation(async (callback: (transaction: typeof tx) => Promise<unknown>) =>
      callback(tx)
    );
    tx.user.findFirst.mockResolvedValue(null);
    tx.role.upsert.mockResolvedValue({ id: "role_superadmin", key: "superadmin" });
    tx.user.create.mockResolvedValue({
      id: "user_super",
      email: "root@example.com",
      status: "active",
      mustChangePassword: true
    });

    const service = new AuthService(prisma as never, new PasswordService(), new JwtService());

    const user = await service.bootstrapSuperadmin({
      secret: "bootstrap-secret",
      email: "root@example.com",
      password: "Super Secure Password",
      name: "Root"
    });

    expect(user).toMatchObject({
      id: "user_super",
      email: "root@example.com",
      status: "active"
    });
    expect(tx.permission.upsert).toHaveBeenCalledTimes(SYSTEM_PERMISSIONS.length);
    expect(tx.userRole.create).toHaveBeenCalledWith({
      data: {
        userId: "user_super",
        roleId: "role_superadmin"
      }
    });
  });

  it("rejects bootstrap requests with the wrong secret", async () => {
    process.env.BOOTSTRAP_SUPERADMIN_ENABLED = "true";
    process.env.BOOTSTRAP_SECRET = "bootstrap-secret";

    const service = new AuthService(createPrismaMock() as never, new PasswordService(), new JwtService());

    await expect(
      service.bootstrapSuperadmin({
        secret: "wrong",
        email: "root@example.com",
        password: "Super Secure Password"
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rotates a valid refresh token and updates the existing session", async () => {
    const prisma = createPrismaMock();
    const jwtService = new JwtService();
    const refreshToken = jwtService.sign({ sub: "user_1", typ: "refresh" }, { expiresInSeconds: 60 });
    prisma.db.authSession.findUnique.mockResolvedValue({
      id: "session_1",
      userId: "user_1",
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000),
      user: {
        id: "user_1",
        email: "active@example.com",
        name: "Active User",
        status: "active",
        mustChangePassword: false
      }
    });

    const service = new AuthService(prisma as never, new PasswordService(), jwtService);

    const result = await service.refreshSession({
      refreshToken,
      userAgent: "vitest",
      ipAddress: "127.0.0.1"
    });

    expect(result.user).toMatchObject({ id: "user_1", email: "active@example.com" });
    expect(prisma.db.authSession.update).toHaveBeenCalledWith({
      where: { id: "session_1" },
      data: expect.objectContaining({
        refreshTokenHash: expect.any(String),
        lastUsedAt: expect.any(Date)
      })
    });
    expect(prisma.db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: "user_1",
        event: "auth.refresh.rotated"
      })
    });
  });

  it("revokes a refresh session on logout", async () => {
    const prisma = createPrismaMock();
    const jwtService = new JwtService();
    const refreshToken = jwtService.sign({ sub: "user_1", typ: "refresh" }, { expiresInSeconds: 60 });
    prisma.db.authSession.findUnique.mockResolvedValue({
      id: "session_1",
      userId: "user_1",
      revokedAt: null,
      expiresAt: new Date(Date.now() + 60_000)
    });

    const service = new AuthService(prisma as never, new PasswordService(), jwtService);

    await service.logout({ refreshToken, userAgent: "vitest", ipAddress: "127.0.0.1" });

    expect(prisma.db.authSession.update).toHaveBeenCalledWith({
      where: { id: "session_1" },
      data: expect.objectContaining({
        revokedAt: expect.any(Date),
        revokedReason: "logout"
      })
    });
  });

  it("changes the password and clears the first-login password-change requirement", async () => {
    const prisma = createPrismaMock();
    const passwordService = new PasswordService();
    prisma.db.user.findUnique.mockResolvedValue({
      id: "user_1",
      email: "active@example.com",
      passwordHash: await passwordService.hash("old-password-123"),
      status: "active",
      mustChangePassword: true
    });
    prisma.db.user.update.mockResolvedValue({
      id: "user_1",
      email: "active@example.com",
      name: "Active User",
      status: "active",
      mustChangePassword: false
    });

    const service = new AuthService(prisma as never, passwordService, new JwtService());

    const user = await service.changePassword({
      userId: "user_1",
      currentPassword: "old-password-123",
      newPassword: "new-password-123"
    });

    expect(user).toMatchObject({ id: "user_1", mustChangePassword: false });
    expect(prisma.db.user.update).toHaveBeenCalledWith({
      where: { id: "user_1" },
      data: expect.objectContaining({
        passwordHash: expect.any(String),
        mustChangePassword: false
      }),
      select: expect.any(Object)
    });
    expect(prisma.db.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        actorUserId: "user_1",
        event: "auth.password.changed"
      })
    });
  });
});
