import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException
} from "@nestjs/common";
import { createHash } from "node:crypto";

import { PrismaService } from "../prisma/prisma.service.js";
import { SYSTEM_PERMISSIONS } from "./auth.constants.js";
import { type AuthTokens, type CurrentUser, type PublicUser } from "./auth.types.js";
import { JwtService } from "./jwt.service.js";
import { PasswordService } from "./password.service.js";

type PrismaAccess = Pick<PrismaService, "db">;

type SignupInput = {
  email: string;
  password: string;
  name?: string;
};

type LoginInput = {
  email: string;
  password: string;
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
};

type BootstrapSuperadminInput = SignupInput & {
  secret: string;
};

type LoginResult = {
  user: PublicUser;
  tokens: AuthTokens;
};

type RefreshInput = {
  refreshToken: string;
  userAgent?: string | undefined;
  ipAddress?: string | undefined;
};

type LogoutInput = RefreshInput;

type ChangePasswordInput = {
  userId: string;
  currentPassword: string;
  newPassword: string;
};

const publicUserSelect = {
  id: true,
  email: true,
  name: true,
  status: true,
  mustChangePassword: true
};

const DEFAULT_ACCESS_EXPIRES_IN_SECONDS = 15 * 60;
const DEFAULT_REFRESH_EXPIRES_IN_SECONDS = 30 * 24 * 60 * 60;
const MAX_FAILED_LOGINS = 5;
const LOCKOUT_MINUTES = 15;

type TokenLifetimes = {
  accessTokenExpiresInSeconds: number;
  refreshTokenExpiresInSeconds: number;
};

@Injectable()
export class AuthService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaAccess,
    @Inject(PasswordService) private readonly passwordService: PasswordService,
    @Inject(JwtService) private readonly jwtService: JwtService
  ) {}

  async signup(input: SignupInput): Promise<PublicUser> {
    const email = normalizeEmail(input.email);
    const existingUser = await this.prisma.db.user.findUnique({
      where: { email },
      select: { id: true }
    });

    if (existingUser) {
      throw new ConflictException("An account with this email already exists");
    }

    const passwordHash = await this.passwordService.hash(input.password);

    const user = await this.prisma.db.user.create({
      data: {
        email,
        name: input.name ?? null,
        passwordHash,
        status: "pending_verification",
        mustChangePassword: false
      },
      select: publicUserSelect
    });

    await this.prisma.db.auditLog.create({
      data: {
        event: "auth.signup.created",
        targetType: "user",
        targetId: user.id,
        metadata: {
          email
        }
      }
    });

    return user;
  }

  async login(input: LoginInput): Promise<LoginResult> {
    console.log(input);
    const email = normalizeEmail(input.email);
    const user = await this.prisma.db.user.findUnique({
      where: { email }
    });

    if (!user) {
      await this.auditLoginFailure(null, "auth.login.failed", input);
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      await this.auditLoginFailure(user.id, "auth.login.locked", input);
      throw new ForbiddenException("Account is temporarily locked");
    }

    const passwordMatches = await this.passwordService.verify(input.password, user.passwordHash);

    if (!passwordMatches) {
      await this.recordFailedLogin(user.id, user.failedLoginCount);
      await this.auditLoginFailure(user.id, "auth.login.failed", input);
      throw new UnauthorizedException("Invalid email or password");
    }

    if (user.status !== "active") {
      await this.prisma.db.auditLog.create({
        data: {
          actorUserId: user.id,
          event: "auth.login.rejected_status",
          ipAddress: input.ipAddress ?? null,
          userAgent: input.userAgent ?? null,
          metadata: {
            status: user.status
          }
        }
      });
      throw new ForbiddenException("Account is not active");
    }

    await this.prisma.db.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        lockedUntil: null
      }
    });

    const tokens = await this.createSessionTokens({
      userId: user.id,
      email: user.email,
      userAgent: input.userAgent ?? null,
      ipAddress: input.ipAddress ?? null
    });

    await this.prisma.db.auditLog.create({
      data: {
        actorUserId: user.id,
        event: "auth.login.success",
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null
      }
    });

    return {
      user: toPublicUser(user),
      tokens
    };
  }

  async bootstrapSuperadmin(input: BootstrapSuperadminInput): Promise<PublicUser> {
    if (process.env.BOOTSTRAP_SUPERADMIN_ENABLED !== "true") {
      throw new ForbiddenException("Superadmin bootstrap is disabled");
    }

    if (!process.env.BOOTSTRAP_SECRET || input.secret !== process.env.BOOTSTRAP_SECRET) {
      throw new UnauthorizedException("Invalid bootstrap secret");
    }

    return this.prisma.db.$transaction(async (tx) => {
      const existingSuperadmin = await tx.user.findFirst({
        where: {
          roles: {
            some: {
              role: {
                key: "superadmin"
              }
            }
          }
        }
      });

      if (existingSuperadmin) {
        throw new ConflictException("A superadmin already exists");
      }

      const permissions = await Promise.all(
        SYSTEM_PERMISSIONS.map((key) =>
          tx.permission.upsert({
            where: { key },
            update: { isSystem: true },
            create: { key, isSystem: true }
          })
        )
      );

      const role = await tx.role.upsert({
        where: { key: "superadmin" },
        update: {
          name: "Superadmin",
          isSystem: true
        },
        create: {
          key: "superadmin",
          name: "Superadmin",
          description: "Full platform administration access.",
          isSystem: true
        }
      });

      const txWithRolePermission = tx as typeof tx & {
        rolePermission?: {
          createMany: (input: {
            data: { roleId: string; permissionId: string }[];
            skipDuplicates: boolean;
          }) => Promise<unknown>;
        };
      };

      if (txWithRolePermission.rolePermission) {
        await txWithRolePermission.rolePermission.createMany({
          data: permissions.map((permission) => ({
            roleId: role.id,
            permissionId: permission.id
          })),
          skipDuplicates: true
        });
      }

      const user = await tx.user.create({
        data: {
          email: normalizeEmail(input.email),
          name: input.name ?? null,
          passwordHash: await this.passwordService.hash(input.password),
          status: "active",
          emailVerifiedAt: new Date(),
          activatedAt: new Date(),
          mustChangePassword: true
        },
        select: publicUserSelect
      });

      await tx.userRole.create({
        data: {
          userId: user.id,
          roleId: role.id
        }
      });

      await tx.auditLog.create({
        data: {
          actorUserId: user.id,
          event: "auth.bootstrap.superadmin_created",
          targetType: "user",
          targetId: user.id
        }
      });

      return user;
    });
  }

  async getCurrentUser(userId: string, permissions: string[]): Promise<CurrentUser> {
    const user = await this.prisma.db.user.findUnique({
      where: { id: userId },
      select: publicUserSelect
    });

    if (!user || user.status !== "active") {
      throw new UnauthorizedException("Authenticated user is unavailable");
    }

    return {
      ...user,
      permissions
    };
  }

  async refreshSession(input: RefreshInput): Promise<LoginResult> {
    const payload = this.jwtService.verify(input.refreshToken);

    if (payload.typ !== "refresh" || typeof payload.sub !== "string") {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const session = await this.prisma.db.authSession.findUnique({
      where: {
        refreshTokenHash: hashToken(input.refreshToken)
      },
      include: {
        user: {
          select: publicUserSelect
        }
      }
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      throw new UnauthorizedException("Refresh session is not active");
    }

    if (session.user.status !== "active") {
      throw new ForbiddenException("Account is not active");
    }

    const tokenLifetimes = getTokenLifetimes();
    const tokens = this.issueTokens(
      {
        userId: session.user.id,
        email: session.user.email
      },
      tokenLifetimes
    );

    await this.prisma.db.authSession.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: hashToken(tokens.refreshToken),
        userAgent: input.userAgent ?? session.userAgent,
        ipAddress: input.ipAddress ?? session.ipAddress,
        lastUsedAt: new Date(),
        expiresAt: new Date(Date.now() + tokenLifetimes.refreshTokenExpiresInSeconds * 1000)
      }
    });

    await this.prisma.db.auditLog.create({
      data: {
        actorUserId: session.user.id,
        event: "auth.refresh.rotated",
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null
      }
    });

    return {
      user: session.user,
      tokens
    };
  }

  async logout(input: LogoutInput): Promise<void> {
    const payload = this.jwtService.verify(input.refreshToken);

    if (payload.typ !== "refresh" || typeof payload.sub !== "string") {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const session = await this.prisma.db.authSession.findUnique({
      where: {
        refreshTokenHash: hashToken(input.refreshToken)
      }
    });

    if (!session || session.revokedAt) {
      return;
    }

    await this.prisma.db.authSession.update({
      where: { id: session.id },
      data: {
        revokedAt: new Date(),
        revokedReason: "logout"
      }
    });

    await this.prisma.db.auditLog.create({
      data: {
        actorUserId: session.userId,
        event: "auth.logout",
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null
      }
    });
  }

  async changePassword(input: ChangePasswordInput): Promise<PublicUser> {
    const user = await this.prisma.db.user.findUnique({
      where: { id: input.userId }
    });

    if (!user || user.status !== "active") {
      throw new UnauthorizedException("Authenticated user is unavailable");
    }

    const passwordMatches = await this.passwordService.verify(
      input.currentPassword,
      user.passwordHash
    );

    if (!passwordMatches) {
      throw new UnauthorizedException("Current password is incorrect");
    }

    const updatedUser = await this.prisma.db.user.update({
      where: { id: input.userId },
      data: {
        passwordHash: await this.passwordService.hash(input.newPassword),
        mustChangePassword: false
      },
      select: publicUserSelect
    });

    await this.prisma.db.auditLog.create({
      data: {
        actorUserId: input.userId,
        event: "auth.password.changed",
        targetType: "user",
        targetId: input.userId
      }
    });

    return updatedUser;
  }

  private async createSessionTokens(input: {
    userId: string;
    email: string;
    userAgent: string | null;
    ipAddress: string | null;
  }): Promise<AuthTokens> {
    const tokenLifetimes = getTokenLifetimes();
    const tokens = this.issueTokens(input, tokenLifetimes);

    await this.prisma.db.authSession.create({
      data: {
        userId: input.userId,
        refreshTokenHash: hashToken(tokens.refreshToken),
        userAgent: input.userAgent,
        ipAddress: input.ipAddress,
        expiresAt: new Date(Date.now() + tokenLifetimes.refreshTokenExpiresInSeconds * 1000)
      }
    });

    return tokens;
  }

  private issueTokens(
    input: { userId: string; email: string },
    tokenLifetimes: TokenLifetimes
  ): AuthTokens {
    return {
      accessToken: this.jwtService.sign(
        {
          sub: input.userId,
          email: input.email,
          typ: "access"
        },
        { expiresInSeconds: tokenLifetimes.accessTokenExpiresInSeconds }
      ),
      refreshToken: this.jwtService.sign(
        {
          sub: input.userId,
          typ: "refresh"
        },
        { expiresInSeconds: tokenLifetimes.refreshTokenExpiresInSeconds }
      ),
      csrfToken: this.jwtService.createOpaqueToken(),
      accessTokenExpiresInSeconds: tokenLifetimes.accessTokenExpiresInSeconds,
      refreshTokenExpiresInSeconds: tokenLifetimes.refreshTokenExpiresInSeconds
    };
  }

  private async recordFailedLogin(userId: string, failedLoginCount: number): Promise<void> {
    const nextFailedLoginCount = failedLoginCount + 1;
    const shouldLock = nextFailedLoginCount >= MAX_FAILED_LOGINS;

    await this.prisma.db.user.update({
      where: { id: userId },
      data: {
        failedLoginCount: nextFailedLoginCount,
        lockedUntil: shouldLock ? new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) : null
      }
    });
  }

  private async auditLoginFailure(
    actorUserId: string | null,
    event: string,
    input: LoginInput
  ): Promise<void> {
    await this.prisma.db.auditLog.create({
      data: {
        actorUserId,
        event,
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: {
          email: normalizeEmail(input.email)
        }
      }
    });
  }
}

function getTokenLifetimes(): TokenLifetimes {
  return {
    accessTokenExpiresInSeconds: readPositiveIntegerEnv(
      "ACCESS_TOKEN_EXPIRES_IN_SECONDS",
      DEFAULT_ACCESS_EXPIRES_IN_SECONDS
    ),
    refreshTokenExpiresInSeconds: readPositiveIntegerEnv(
      "REFRESH_TOKEN_EXPIRES_IN_SECONDS",
      DEFAULT_REFRESH_EXPIRES_IN_SECONDS
    )
  };
}

function readPositiveIntegerEnv(name: string, fallback: number): number {
  const rawValue = process.env[name];
  const value = Number.parseInt(rawValue ?? "", 10);

  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function toPublicUser(user: {
  id: string;
  email: string;
  name: string | null;
  status: string;
  mustChangePassword: boolean;
}): PublicUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
    mustChangePassword: user.mustChangePassword
  };
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
