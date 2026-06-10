import { type AuthenticatedUser } from "../auth/auth.types.js";

export type RequestWithUser = { user?: AuthenticatedUser };

export function requireUserId(request: RequestWithUser): string {
  if (!request.user) {
    throw new Error("JwtAuthGuard did not attach a user");
  }
  return request.user.id;
}
