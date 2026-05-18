import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { AuthSession, LoginRequest } from "@guidora/contracts";
import { PrismaService } from "@guidora/db";
import { hashToken, setAuthCookies, clearAuthCookies, readCookie } from "./cookies";
import { verifyPassword } from "./password";
import { signToken, verifyToken } from "./jwt";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "./auth.constants";
import { AuthenticatedRequest, CookieResponse } from "./auth.types";
import { toCurrentUser, userWithRoleInclude } from "./user.mapper";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService
  ) {}

  async login(input: LoginRequest, response: CookieResponse): Promise<AuthSession> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      include: userWithRoleInclude
    });

    if (!user || user.status !== "ACTIVE" || !verifyPassword(input.password, user.passwordHash)) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const tokens = await this.issueTokens(user.id);
    setAuthCookies(
      response,
      tokens.accessToken,
      tokens.refreshToken,
      this.accessTtlSeconds,
      this.refreshTtlSeconds
    );

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
      include: userWithRoleInclude
    });

    return { user: toCurrentUser(updatedUser) };
  }

  async refresh(request: AuthenticatedRequest, response: CookieResponse): Promise<AuthSession> {
    const refreshToken = readCookie(request, REFRESH_COOKIE_NAME);

    if (!refreshToken) {
      throw new UnauthorizedException("Missing refresh token");
    }

    const payload = verifyToken(refreshToken, "refresh", this.refreshSecret);
    const storedToken = await this.prisma.refreshToken.findFirst({
      where: {
        tokenHash: hashToken(refreshToken),
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() }
      },
      include: {
        user: {
          include: userWithRoleInclude
        }
      }
    });

    if (!storedToken || storedToken.user.status !== "ACTIVE") {
      throw new UnauthorizedException("Invalid refresh token");
    }

    await this.prisma.refreshToken.updateMany({
      where: { tokenHash: hashToken(refreshToken) },
      data: { revokedAt: new Date() }
    });

    const tokens = await this.issueTokens(storedToken.userId);
    setAuthCookies(
      response,
      tokens.accessToken,
      tokens.refreshToken,
      this.accessTtlSeconds,
      this.refreshTtlSeconds
    );

    return { user: toCurrentUser(storedToken.user) };
  }

  async logout(request: AuthenticatedRequest, response: CookieResponse): Promise<{ ok: true }> {
    const refreshToken = readCookie(request, REFRESH_COOKIE_NAME);

    if (refreshToken) {
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash: hashToken(refreshToken), revokedAt: null },
        data: { revokedAt: new Date() }
      });
    }

    clearAuthCookies(response);
    return { ok: true };
  }

  async authenticateRequest(request: AuthenticatedRequest): Promise<AuthSession["user"]> {
    const accessToken = readCookie(request, ACCESS_COOKIE_NAME) ?? this.readBearerToken(request);

    if (!accessToken) {
      throw new UnauthorizedException("Missing access token");
    }

    const payload = verifyToken(accessToken, "access", this.accessSecret);
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: userWithRoleInclude
    });

    if (!user || user.status !== "ACTIVE") {
      throw new UnauthorizedException("Invalid access token");
    }

    return toCurrentUser(user);
  }

  private async issueTokens(userId: string): Promise<{ accessToken: string; refreshToken: string }> {
    const accessToken = signToken(userId, "access", this.accessSecret, this.accessTtlSeconds);
    const refreshToken = signToken(userId, "refresh", this.refreshSecret, this.refreshTtlSeconds);

    await this.prisma.refreshToken.create({
      data: {
        tokenHash: hashToken(refreshToken),
        userId,
        expiresAt: new Date(Date.now() + this.refreshTtlSeconds * 1000)
      }
    });

    return { accessToken, refreshToken };
  }

  private readBearerToken(request: AuthenticatedRequest): string | null {
    const authorization = request.headers.authorization;
    const value = Array.isArray(authorization) ? authorization[0] : authorization;

    if (!value?.startsWith("Bearer ")) {
      return null;
    }

    return value.slice("Bearer ".length);
  }

  private get accessSecret(): string {
    return this.configService.getOrThrow<string>("JWT_ACCESS_SECRET");
  }

  private get refreshSecret(): string {
    return this.configService.getOrThrow<string>("JWT_REFRESH_SECRET");
  }

  private get accessTtlSeconds(): number {
    return this.configService.getOrThrow<number>("JWT_ACCESS_TTL_SECONDS");
  }

  private get refreshTtlSeconds(): number {
    return this.configService.getOrThrow<number>("JWT_REFRESH_TTL_SECONDS");
  }
}
