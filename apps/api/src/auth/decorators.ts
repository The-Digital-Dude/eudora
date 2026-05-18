import { SetMetadata, createParamDecorator, ExecutionContext } from "@nestjs/common";
import { Permission } from "@guidora/contracts";
import { IS_PUBLIC_ROUTE, REQUIRED_PERMISSIONS } from "./auth.constants";
import { AuthenticatedRequest } from "./auth.types";

export const Public = () => SetMetadata(IS_PUBLIC_ROUTE, true);

export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(REQUIRED_PERMISSIONS, permissions);

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext) => {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.guidoraUser;
  }
);
