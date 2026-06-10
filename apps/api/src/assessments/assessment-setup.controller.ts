import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { CsrfGuard } from "../auth/csrf.guard.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PermissionsGuard } from "../rbac/permissions.guard.js";
import { RequirePermissions } from "../rbac/require-permissions.decorator.js";
import {
  CreateAssessmentDto,
  CreateLookupDto,
  ListAssessmentsQueryDto,
  LookupQueryDto,
  UpdateAssessmentDto,
  UpdateLookupDto
} from "./assessments.dto.js";
import { AssessmentListQueries, LookupQueries } from "./assessments.openapi.js";
import { AssessmentSetupService } from "./assessment-setup.service.js";
import { type RequestWithUser, requireUserId } from "./request-user.js";

@ApiTags("assessments")
@Controller("api")
@UseGuards(JwtAuthGuard, CsrfGuard, PermissionsGuard)
export class AssessmentSetupController {
  constructor(@Inject(AssessmentSetupService) private readonly assessmentSetupService: AssessmentSetupService) {}

  @Get("assessment-types")
  @LookupQueries()
  @RequirePermissions("assessments.read")
  async listAssessmentTypes(@Query() query: LookupQueryDto) {
    return this.assessmentSetupService.listAssessmentTypes(query);
  }

  @Post("assessment-types")
  @RequirePermissions("assessments.manage")
  async createAssessmentType(@Body() body: CreateLookupDto, @Req() request: RequestWithUser) {
    return this.assessmentSetupService.createAssessmentType(body, requireUserId(request));
  }

  @Put("assessment-types/:id")
  @RequirePermissions("assessments.manage")
  async updateAssessmentType(@Param("id") id: string, @Body() body: UpdateLookupDto, @Req() request: RequestWithUser) {
    return this.assessmentSetupService.updateAssessmentType(id, body, requireUserId(request));
  }

  @Get("assessment-levels")
  @LookupQueries()
  @RequirePermissions("assessments.read")
  async listLevels(@Query() query: LookupQueryDto) {
    return this.assessmentSetupService.listLevels(query);
  }

  @Post("assessment-levels")
  @RequirePermissions("assessments.manage")
  async createLevel(@Body() body: CreateLookupDto, @Req() request: RequestWithUser) {
    return this.assessmentSetupService.createLevel(body, requireUserId(request));
  }

  @Put("assessment-levels/:id")
  @RequirePermissions("assessments.manage")
  async updateLevel(@Param("id") id: string, @Body() body: UpdateLookupDto, @Req() request: RequestWithUser) {
    return this.assessmentSetupService.updateLevel(id, body, requireUserId(request));
  }

  @Get("assessments")
  @AssessmentListQueries()
  @RequirePermissions("assessments.read")
  async listAssessments(@Query() query: ListAssessmentsQueryDto) {
    return this.assessmentSetupService.listAssessments(query);
  }

  @Get("assessments/:id")
  @RequirePermissions("assessments.read")
  async getAssessment(@Param("id") id: string) {
    return this.assessmentSetupService.getAssessment(id);
  }

  @Post("assessments")
  @RequirePermissions("assessments.manage")
  async createAssessment(@Body() body: CreateAssessmentDto, @Req() request: RequestWithUser) {
    return this.assessmentSetupService.createAssessment(body, requireUserId(request));
  }

  @Put("assessments/:id")
  @RequirePermissions("assessments.manage")
  async updateAssessment(@Param("id") id: string, @Body() body: UpdateAssessmentDto, @Req() request: RequestWithUser) {
    return this.assessmentSetupService.updateAssessment(id, body, requireUserId(request));
  }

  @Delete("assessments/:id")
  @RequirePermissions("assessments.manage")
  async archiveAssessment(@Param("id") id: string, @Req() request: RequestWithUser) {
    return this.assessmentSetupService.archiveAssessment(id, requireUserId(request));
  }

  @Post("assessments/:id/publish")
  @RequirePermissions("assessments.manage")
  async publishAssessment(@Param("id") id: string, @Req() request: RequestWithUser) {
    return this.assessmentSetupService.publishAssessment(id, requireUserId(request));
  }
}
