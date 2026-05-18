import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Permission } from "@guidora/contracts";
import { REQUIRED_PERMISSIONS } from "./auth.constants";
import { AuthenticatedRequest } from "./auth.types";

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      REQUIRED_PERMISSIONS,
      [context.getHandler(), context.getClass()]
    );

    if (!requiredPermissions?.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userPermissions = request.guidoraUser?.permissions ?? [];
    const hasEveryPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasEveryPermission) {
      throw new ForbiddenException("You do not have permission to perform this action");
    }

    return true;
  }
}
