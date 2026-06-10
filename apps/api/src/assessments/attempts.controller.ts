import { Body, Controller, Get, Inject, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { CsrfGuard } from "../auth/csrf.guard.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PermissionsGuard } from "../rbac/permissions.guard.js";
import { RequirePermissions } from "../rbac/require-permissions.decorator.js";
import { CreateAttemptDto, ListAttemptsQueryDto, MarkAttemptDto, UpdateAttemptDto } from "./assessments.dto.js";
import { AttemptListQueries } from "./assessments.openapi.js";
import { AttemptsService } from "./attempts.service.js";
import { type RequestWithUser, requireUserId } from "./request-user.js";

@ApiTags("assessments")
@Controller("api")
@UseGuards(JwtAuthGuard, CsrfGuard, PermissionsGuard)
export class AttemptsController {
  constructor(@Inject(AttemptsService) private readonly attemptsService: AttemptsService) {}

  @Get("attempts")
  @AttemptListQueries()
  @RequirePermissions("assessments.read")
  async listAttempts(@Query() query: ListAttemptsQueryDto) {
    return this.attemptsService.listAttempts(query);
  }

  @Get("attempts/:id")
  @RequirePermissions("assessments.read")
  async getAttempt(@Param("id") id: string) {
    return this.attemptsService.getAttempt(id);
  }

  @Post("attempts")
  @RequirePermissions("assessments.attempt")
  async startAttempt(@Body() body: CreateAttemptDto, @Req() request: RequestWithUser) {
    return this.attemptsService.startAttempt(body, requireUserId(request));
  }

  @Put("attempts/:id")
  @RequirePermissions("assessments.attempt")
  async updateAttempt(@Param("id") id: string, @Body() body: UpdateAttemptDto, @Req() request: RequestWithUser) {
    return this.attemptsService.updateAttempt(id, body, requireUserId(request));
  }

  @Post("attempts/:id/submit")
  @RequirePermissions("assessments.attempt")
  async submitAttempt(@Param("id") id: string, @Req() request: RequestWithUser) {
    return this.attemptsService.submitAttempt(id, requireUserId(request));
  }

  @Post("attempts/:id/mark")
  @RequirePermissions("assessments.mark")
  async markAttempt(@Param("id") id: string, @Body() body: MarkAttemptDto, @Req() request: RequestWithUser) {
    return this.attemptsService.markAttempt(id, body, requireUserId(request));
  }

  @Get("students/:id/attempts")
  @AttemptListQueries(["studentId"])
  @RequirePermissions("assessments.read")
  async listStudentAttempts(@Param("id") id: string, @Query() query: ListAttemptsQueryDto) {
    return this.attemptsService.listAttempts({ ...query, studentId: id });
  }

  @Get("assignments/:id/attempts")
  @AttemptListQueries(["assessmentAssignmentId"])
  @RequirePermissions("assessments.read")
  async listAssignmentAttempts(@Param("id") id: string, @Query() query: ListAttemptsQueryDto) {
    return this.attemptsService.listAttempts({ ...query, assessmentAssignmentId: id });
  }
}
