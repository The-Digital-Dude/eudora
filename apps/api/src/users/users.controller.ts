import { Body, Controller, Get, HttpCode, Param, Patch, Post } from "@nestjs/common";
import {
  CurrentUser as CurrentUserContract,
  PERMISSIONS,
  createUserRequestSchema,
  updateUserRequestSchema
} from "@guidora/contracts";
import { CurrentUser, Permissions } from "../auth/decorators";
import { parseBody } from "../auth/zod";
import { UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions(PERMISSIONS.USERS_READ)
  list() {
    return this.usersService.list();
  }

  @Post()
  @Permissions(PERMISSIONS.USERS_CREATE)
  create(@Body() body: unknown) {
    return this.usersService.create(parseBody(createUserRequestSchema, body));
  }

  @Patch(":id")
  @Permissions(PERMISSIONS.USERS_UPDATE)
  update(
    @Param("id") id: string,
    @Body() body: unknown,
    @CurrentUser() actor: CurrentUserContract
  ) {
    return this.usersService.update(id, parseBody(updateUserRequestSchema, body), actor);
  }

  @Post(":id/reset-password")
  @HttpCode(200)
  @Permissions(PERMISSIONS.USERS_RESET_PASSWORD)
  resetPassword(@Param("id") id: string, @CurrentUser() actor: CurrentUserContract) {
    return this.usersService.resetPassword(id, actor);
  }

  @Post(":id/disable")
  @HttpCode(200)
  @Permissions(PERMISSIONS.USERS_DISABLE)
  disable(@Param("id") id: string, @CurrentUser() actor: CurrentUserContract) {
    return this.usersService.disable(id, actor);
  }
}
