import { Body, Controller, Get, Inject, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { CsrfGuard } from "../auth/csrf.guard.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PermissionsGuard } from "../rbac/permissions.guard.js";
import { RequirePermissions } from "../rbac/require-permissions.decorator.js";
import { CreateLookupDto, LookupQueryDto, UpdateLookupDto } from "./assessments.dto.js";
import { LookupQueries } from "./assessments.openapi.js";
import { type RequestWithUser, requireUserId } from "./request-user.js";
import { SubjectsService } from "./subjects.service.js";

@ApiTags("assessments")
@Controller("api")
@UseGuards(JwtAuthGuard, CsrfGuard, PermissionsGuard)
export class SubjectsController {
  constructor(@Inject(SubjectsService) private readonly subjectsService: SubjectsService) {}

  @Get("subjects")
  @LookupQueries()
  @RequirePermissions("assessments.read")
  async listSubjects(@Query() query: LookupQueryDto) {
    return this.subjectsService.listSubjects(query);
  }

  @Post("subjects")
  @RequirePermissions("assessments.manage")
  async createSubject(@Body() body: CreateLookupDto, @Req() request: RequestWithUser) {
    return this.subjectsService.createSubject(body, requireUserId(request));
  }

  @Put("subjects/:id")
  @RequirePermissions("assessments.manage")
  async updateSubject(@Param("id") id: string, @Body() body: UpdateLookupDto, @Req() request: RequestWithUser) {
    return this.subjectsService.updateSubject(id, body, requireUserId(request));
  }
}
