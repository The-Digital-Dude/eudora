import { Body, Controller, Get, HttpCode, Post, Req, Res } from "@nestjs/common";
import { AuthSession, loginRequestSchema } from "@guidora/contracts";
import { AuthService } from "./auth.service";
import { CurrentUser, Public } from "./decorators";
import { parseBody } from "./zod";
import { AuthenticatedRequest, CookieResponse } from "./auth.types";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post("login")
  @HttpCode(200)
  async login(
    @Body() body: unknown,
    @Res({ passthrough: true }) response: CookieResponse
  ): Promise<AuthSession> {
    return this.authService.login(parseBody(loginRequestSchema, body), response);
  }

  @Public()
  @Post("refresh")
  @HttpCode(200)
  async refresh(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: CookieResponse
  ): Promise<AuthSession> {
    return this.authService.refresh(request, response);
  }

  @Post("logout")
  @HttpCode(200)
  async logout(
    @Req() request: AuthenticatedRequest,
    @Res({ passthrough: true }) response: CookieResponse
  ): Promise<{ ok: true }> {
    return this.authService.logout(request, response);
  }

  @Get("me")
  me(@CurrentUser() user: AuthSession["user"]): AuthSession {
    return { user };
  }
}
