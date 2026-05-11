import type { CanActivate, ExecutionContext } from "@nestjs/common";
import { Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Permission } from "@guidora/contracts";
import { forbidden } from "../errors/domain-errors";
import { REQUIRED_PERMISSIONS_KEY } from "../permissions/permissions.decorator";

type RequestWithUser = {
  user?: {
    roles: string[];
  };
};

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions =
      this.reflector.getAllAndOverride<Permission[]>(REQUIRED_PERMISSIONS_KEY, [
        context.getHandler(),
        context.getClass()
      ]) ?? [];

    if (requiredPermissions.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<RequestWithUser>();
    if (request.user?.roles.includes("developer") || request.user?.roles.includes("owner")) {
      return true;
    }

    throw forbidden();
  }
}
