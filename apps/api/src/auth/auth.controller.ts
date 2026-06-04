import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { ACCESS_TOKEN_COOKIE, CSRF_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from "./auth.constants.js";
import { AuthService } from "./auth.service.js";
import { type AuthenticatedUser, type AuthTokens } from "./auth.types.js";
import { parseCookieHeader } from "./cookies.js";
import { CsrfGuard } from "./csrf.guard.js";
import {
  BootstrapSuperadminDto,
  ChangePasswordDto,
  CurrentUserResponseDto,
  LoginDto,
  PublicUserResponseDto,
  SignupDto
} from "./dto/auth.dto.js";
import { JwtAuthGuard } from "./jwt-auth.guard.js";

type RequestLike = {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  user?: AuthenticatedUser;
};

type ResponseLike = {
  cookie: (
    name: string,
    value: string,
    options: {
      httpOnly: boolean;
      sameSite: "lax";
      secure: boolean;
      maxAge: number;
      path: string;
    }
  ) => void;
  clearCookie: (
    name: string,
    options: {
      path: string;
    }
  ) => void;
};

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(@Inject(AuthService) private readonly authService: AuthService) {}

  @Post("signup")
  async signup(@Body() body: SignupDto): Promise<PublicUserResponseDto> {
    return this.authService.signup(body);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() body: LoginDto,
    @Req() request: RequestLike,
    @Res({ passthrough: true }) response: ResponseLike
  ): Promise<PublicUserResponseDto> {
    // console.log(body);
    const result = await this.authService.login({
      ...body,
      userAgent: headerToString(request.headers["user-agent"]),
      ipAddress: request.ip
    });
    // console.log(result);
    setAuthCookies(response, result.tokens);

    return result.user;
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  async me(@Req() request: RequestLike): Promise<CurrentUserResponseDto> {
    if (!request.user) {
      throw new Error("JwtAuthGuard did not attach a user");
    }

    return this.authService.getCurrentUser(request.user.id, request.user.permissions);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Req() request: RequestLike,
    @Res({ passthrough: true }) response: ResponseLike
  ): Promise<PublicUserResponseDto> {
    const refreshToken = parseCookieHeader(headerToString(request.headers.cookie))[
      REFRESH_TOKEN_COOKIE
    ];

    if (!refreshToken) {
      throw new UnauthorizedException("Refresh token cookie is required");
    }

    const result = await this.authService.refreshSession({
      refreshToken,
      userAgent: headerToString(request.headers["user-agent"]),
      ipAddress: request.ip
    });

    setAuthCookies(response, result.tokens);

    return result.user;
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(CsrfGuard)
  async logout(
    @Req() request: RequestLike,
    @Res({ passthrough: true }) response: ResponseLike
  ): Promise<void> {
    const refreshToken = parseCookieHeader(headerToString(request.headers.cookie))[
      REFRESH_TOKEN_COOKIE
    ];

    if (refreshToken) {
      await this.authService.logout({
        refreshToken,
        userAgent: headerToString(request.headers["user-agent"]),
        ipAddress: request.ip
      });
    }

    clearAuthCookies(response);
  }

  @Post("change-password")
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, CsrfGuard)
  async changePassword(
    @Body() body: ChangePasswordDto,
    @Req() request: RequestLike
  ): Promise<PublicUserResponseDto> {
    if (!request.user) {
      throw new Error("JwtAuthGuard did not attach a user");
    }

    return this.authService.changePassword({
      userId: request.user.id,
      currentPassword: body.currentPassword,
      newPassword: body.newPassword
    });
  }

  @Post("bootstrap/superadmin")
  async bootstrapSuperadmin(@Body() body: BootstrapSuperadminDto): Promise<PublicUserResponseDto> {
    return this.authService.bootstrapSuperadmin(body);
  }
}

function setAuthCookies(response: ResponseLike, tokens: AuthTokens): void {
  const secure = process.env.NODE_ENV === "production";

  response.cookie(ACCESS_TOKEN_COOKIE, tokens.accessToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: tokens.accessTokenExpiresInSeconds * 1000,
    path: "/"
  });
  response.cookie(REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
    httpOnly: true,
    sameSite: "lax",
    secure,
    maxAge: tokens.refreshTokenExpiresInSeconds * 1000,
    path: "/auth"
  });
  response.cookie(CSRF_TOKEN_COOKIE, tokens.csrfToken, {
    httpOnly: false,
    sameSite: "lax",
    secure,
    maxAge: tokens.refreshTokenExpiresInSeconds * 1000,
    path: "/"
  });
}

function clearAuthCookies(response: ResponseLike): void {
  response.clearCookie(ACCESS_TOKEN_COOKIE, { path: "/" });
  response.clearCookie(REFRESH_TOKEN_COOKIE, { path: "/auth" });
  response.clearCookie(CSRF_TOKEN_COOKIE, { path: "/" });
}

function headerToString(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value.join(",") : value;
}
