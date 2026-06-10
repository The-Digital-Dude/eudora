import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { CsrfGuard } from "../auth/csrf.guard.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PermissionsGuard } from "../rbac/permissions.guard.js";
import { RequirePermissions } from "../rbac/require-permissions.decorator.js";
import { CreateAssignmentDto, ListAssignmentsQueryDto, UpdateAssignmentDto } from "./assessments.dto.js";
import { AssignmentListQueries } from "./assessments.openapi.js";
import { AssignmentsService } from "./assignments.service.js";
import { type RequestWithUser, requireUserId } from "./request-user.js";

@ApiTags("assessments")
@Controller("api")
@UseGuards(JwtAuthGuard, CsrfGuard, PermissionsGuard)
export class AssignmentsController {
  constructor(@Inject(AssignmentsService) private readonly assignmentsService: AssignmentsService) {}

  @Get("assignments")
  @AssignmentListQueries()
  @RequirePermissions("assessments.read")
  async listAssignments(@Query() query: ListAssignmentsQueryDto) {
    return this.assignmentsService.listAssignments(query);
  }

  @Get("assignments/:id")
  @RequirePermissions("assessments.read")
  async getAssignment(@Param("id") id: string) {
    return this.assignmentsService.getAssignment(id);
  }

  @Post("assignments")
  @RequirePermissions("assessments.assign")
  async createAssignment(@Body() body: CreateAssignmentDto, @Req() request: RequestWithUser) {
    return this.assignmentsService.createAssignment(body, requireUserId(request));
  }

  @Put("assignments/:id")
  @RequirePermissions("assessments.assign")
  async updateAssignment(@Param("id") id: string, @Body() body: UpdateAssignmentDto, @Req() request: RequestWithUser) {
    return this.assignmentsService.updateAssignment(id, body, requireUserId(request));
  }

  @Delete("assignments/:id")
  @RequirePermissions("assessments.assign")
  async cancelAssignment(@Param("id") id: string, @Req() request: RequestWithUser) {
    return this.assignmentsService.cancelAssignment(id, requireUserId(request));
  }

  @Post("assignments/:id/remind")
  @RequirePermissions("assessments.assign")
  async remindAssignment(@Param("id") id: string, @Req() request: RequestWithUser) {
    return this.assignmentsService.remindAssignment(id, requireUserId(request));
  }

  @Get("students/:id/assignments")
  @AssignmentListQueries(["studentId"])
  @RequirePermissions("assessments.read")
  async listStudentAssignments(@Param("id") id: string, @Query() query: ListAssignmentsQueryDto) {
    return this.assignmentsService.listAssignments({ ...query, studentId: id });
  }

  @Get("classes/:id/assignments")
  @AssignmentListQueries(["classId"])
  @RequirePermissions("assessments.read")
  async listClassAssignments(@Param("id") id: string, @Query() query: ListAssignmentsQueryDto) {
    return this.assignmentsService.listAssignments({ ...query, classId: id });
  }
}
