import { Body, Controller, Get, Inject, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { CsrfGuard } from "../auth/csrf.guard.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PermissionsGuard } from "../rbac/permissions.guard.js";
import { RequirePermissions } from "../rbac/require-permissions.decorator.js";
import {
  ListResponsesQueryDto,
  MarkStudentResponseDto,
  SaveStudentResponseDto,
  UpdateStudentResponseDto
} from "./assessments.dto.js";
import { ResponseListQueries } from "./assessments.openapi.js";
import { type RequestWithUser, requireUserId } from "./request-user.js";
import { StudentResponsesService } from "./student-responses.service.js";

@ApiTags("assessments")
@Controller("api")
@UseGuards(JwtAuthGuard, CsrfGuard, PermissionsGuard)
export class StudentResponsesController {
  constructor(@Inject(StudentResponsesService) private readonly studentResponsesService: StudentResponsesService) {}

  @Get("responses")
  @ResponseListQueries()
  @RequirePermissions("assessments.read")
  async listResponses(@Query() query: ListResponsesQueryDto) {
    return this.studentResponsesService.listResponses(query);
  }

  @Get("responses/:id")
  @RequirePermissions("assessments.read")
  async getResponse(@Param("id") id: string) {
    return this.studentResponsesService.getResponse(id);
  }

  @Post("responses")
  @RequirePermissions("assessments.attempt")
  async saveResponse(@Body() body: SaveStudentResponseDto, @Req() request: RequestWithUser) {
    return this.studentResponsesService.saveResponse(body, requireUserId(request));
  }

  @Put("responses/:id")
  @RequirePermissions("assessments.attempt")
  async updateResponse(@Param("id") id: string, @Body() body: UpdateStudentResponseDto, @Req() request: RequestWithUser) {
    return this.studentResponsesService.updateResponse(id, body, requireUserId(request));
  }

  @Post("responses/:id/mark")
  @RequirePermissions("assessments.mark")
  async markResponse(@Param("id") id: string, @Body() body: MarkStudentResponseDto, @Req() request: RequestWithUser) {
    return this.studentResponsesService.markResponse(id, body, requireUserId(request));
  }

  @Get("attempts/:id/responses")
  @ResponseListQueries(["assessmentAttemptId"])
  @RequirePermissions("assessments.read")
  async listAttemptResponses(@Param("id") id: string, @Query() query: ListResponsesQueryDto) {
    return this.studentResponsesService.listResponses({ ...query, assessmentAttemptId: id });
  }

  @Get("questions/:id/responses")
  @ResponseListQueries(["questionId"])
  @RequirePermissions("assessments.read")
  async listQuestionResponses(@Param("id") id: string, @Query() query: ListResponsesQueryDto) {
    return this.studentResponsesService.listResponses({ ...query, questionId: id });
  }
}
