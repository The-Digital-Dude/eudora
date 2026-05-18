import { CurrentUser } from "@guidora/contracts";

export type AuthenticatedRequest = {
  headers: Record<string, string | string[] | undefined>;
  guidoraUser?: CurrentUser;
};

export type CookieResponse = {
  cookie(name: string, value: string, options: CookieOptions): void;
  clearCookie(name: string, options: Pick<CookieOptions, "httpOnly" | "sameSite" | "secure" | "path">): void;
};

export type CookieOptions = {
  httpOnly: boolean;
  sameSite: "lax" | "strict" | "none";
  secure: boolean;
  path: string;
  maxAge?: number;
};
