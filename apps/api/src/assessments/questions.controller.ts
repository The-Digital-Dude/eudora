import { Body, Controller, Delete, Get, Inject, Param, Post, Put, Query, Req, UseGuards } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

import { CsrfGuard } from "../auth/csrf.guard.js";
import { JwtAuthGuard } from "../auth/jwt-auth.guard.js";
import { PermissionsGuard } from "../rbac/permissions.guard.js";
import { RequirePermissions } from "../rbac/require-permissions.decorator.js";
import {
  AddAssessmentQuestionDto,
  CreateQuestionDto,
  ListQuestionsQueryDto,
  UpdateAssessmentQuestionDto,
  UpdateQuestionDto
} from "./assessments.dto.js";
import { QuestionListQueries } from "./assessments.openapi.js";
import { QuestionsService } from "./questions.service.js";
import { type RequestWithUser, requireUserId } from "./request-user.js";

@ApiTags("assessments")
@Controller("api")
@UseGuards(JwtAuthGuard, CsrfGuard, PermissionsGuard)
export class QuestionsController {
  constructor(@Inject(QuestionsService) private readonly questionsService: QuestionsService) {}

  @Get("questions")
  @QuestionListQueries()
  @RequirePermissions("assessments.read")
  async listQuestions(@Query() query: ListQuestionsQueryDto) {
    return this.questionsService.listQuestions(query);
  }

  @Get("questions/:id")
  @RequirePermissions("assessments.read")
  async getQuestion(@Param("id") id: string) {
    return this.questionsService.getQuestion(id);
  }

  @Post("questions")
  @RequirePermissions("assessments.manage")
  async createQuestion(@Body() body: CreateQuestionDto, @Req() request: RequestWithUser) {
    return this.questionsService.createQuestion(body, requireUserId(request));
  }

  @Put("questions/:id")
  @RequirePermissions("assessments.manage")
  async updateQuestion(@Param("id") id: string, @Body() body: UpdateQuestionDto, @Req() request: RequestWithUser) {
    return this.questionsService.updateQuestion(id, body, requireUserId(request));
  }

  @Delete("questions/:id")
  @RequirePermissions("assessments.manage")
  async archiveQuestion(@Param("id") id: string, @Req() request: RequestWithUser) {
    return this.questionsService.archiveQuestion(id, requireUserId(request));
  }

  @Post("assessments/:id/questions")
  @RequirePermissions("assessments.manage")
  async addQuestionToAssessment(
    @Param("id") id: string,
    @Body() body: AddAssessmentQuestionDto,
    @Req() request: RequestWithUser
  ) {
    return this.questionsService.addQuestionToAssessment(id, body, requireUserId(request));
  }

  @Delete("assessments/:assessmentId/questions/:questionId")
  @RequirePermissions("assessments.manage")
  async removeQuestionFromAssessment(
    @Param("assessmentId") assessmentId: string,
    @Param("questionId") questionId: string,
    @Req() request: RequestWithUser
  ) {
    return this.questionsService.removeQuestionFromAssessment(assessmentId, questionId, requireUserId(request));
  }

  @Put("assessments/:assessmentId/questions/:questionId")
  @RequirePermissions("assessments.manage")
  async updateAssessmentQuestion(
    @Param("assessmentId") assessmentId: string,
    @Param("questionId") questionId: string,
    @Body() body: UpdateAssessmentQuestionDto,
    @Req() request: RequestWithUser
  ) {
    return this.questionsService.updateAssessmentQuestion(assessmentId, questionId, body, requireUserId(request));
  }
}
