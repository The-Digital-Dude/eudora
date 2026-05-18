import { createHash } from "node:crypto";
import { ACCESS_COOKIE_NAME, REFRESH_COOKIE_NAME } from "./auth.constants";
import { AuthenticatedRequest, CookieOptions, CookieResponse } from "./auth.types";

export function readCookie(request: AuthenticatedRequest, name: string): string | null {
  const cookieHeader = request.headers.cookie;
  const cookieText = Array.isArray(cookieHeader) ? cookieHeader.join(";") : cookieHeader;

  if (!cookieText) {
    return null;
  }

  const cookies = cookieText.split(";").map((cookie) => cookie.trim());
  const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));

  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function authCookieOptions(maxAgeSeconds?: number): CookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: maxAgeSeconds ? maxAgeSeconds * 1000 : undefined
  };
}

export function setAuthCookies(
  response: CookieResponse,
  accessToken: string,
  refreshToken: string,
  accessTtlSeconds: number,
  refreshTtlSeconds: number
): void {
  response.cookie(ACCESS_COOKIE_NAME, accessToken, authCookieOptions(accessTtlSeconds));
  response.cookie(REFRESH_COOKIE_NAME, refreshToken, authCookieOptions(refreshTtlSeconds));
}

export function clearAuthCookies(response: CookieResponse): void {
  const options = authCookieOptions();
  response.clearCookie(ACCESS_COOKIE_NAME, options);
  response.clearCookie(REFRESH_COOKIE_NAME, options);
}
