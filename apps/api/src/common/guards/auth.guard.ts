import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import type { ActorContext } from "@guidora/contracts";
import { authenticationRequired } from "../errors/domain-errors";

type RequestWithUser = {
  headers: Record<string, string | string[] | undefined>;
  user?: ActorContext;
};

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithUser>();

    if (!request.headers.authorization) {
      throw authenticationRequired();
    }

    request.user = {
      userId: "foundation-user",
      providerUserId: "foundation-provider-user",
      roles: ["developer"],
      centreIds: [],
      familyAccountIds: [],
      studentIds: [],
      isDisabled: false
    };

    return true;
  }
}
