import { Controller, Get, UseGuards } from "@nestjs/common";
import type { ActorContext, ApiSuccess } from "@guidora/contracts";
import { PERMISSIONS } from "@guidora/contracts";
import { CurrentUser } from "../../common/auth/current-user.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
import { PermissionGuard } from "../../common/guards/permission.guard";
import { RequirePermissions } from "../../common/permissions/permissions.decorator";

@Controller("identity")
@UseGuards(AuthGuard, PermissionGuard)
export class IdentityController {
  @Get("me")
  @RequirePermissions(PERMISSIONS.STUDENT_PROFILE_VIEW)
  me(@CurrentUser() user: ActorContext): ApiSuccess<ActorContext> {
    return {
      data: user
    };
  }
}
