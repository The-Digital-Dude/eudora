import { BadRequestException, ConflictException, Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service.js";
import {
  CreateAttemptDto,
  ListAttemptsQueryDto,
  MarkAttemptDto,
  UpdateAttemptDto
} from "./assessments.dto.js";
import {
  AssessmentDomainService,
  type PrismaAccess,
  attemptSelect,
  autoMarkResponse,
  emptyToNull,
  enumFilter,
  enumValue,
  idFilter,
  normalizePagination,
  nullableNonNegativeInteger,
  nullableNonNegativeNumber,
  nullablePositiveNumber,
  requireRecord,
  requireText,
  toPage
} from "./assessments.common.js";

@Injectable()
export class AttemptsService extends AssessmentDomainService {
  constructor(@Inject(PrismaService) prisma: PrismaAccess) {
    super(prisma);
  }

  async listAttempts(query: ListAttemptsQueryDto = {}) {
    const pagination = normalizePagination(query);
    const where = {
      ...idFilter("assessmentAssignmentId", query.assessmentAssignmentId),
      ...idFilter("studentId", query.studentId),
      ...enumFilter("resultStatus", query.resultStatus, ["in_progress", "submitted", "marked", "needs_review"])
    };
    const [items, total] = await Promise.all([
      this.prisma.db.assessmentAttempt.findMany({
        where,
        orderBy: { startedAt: "desc" },
        skip: pagination.skip,
        take: pagination.pageSize,
        select: attemptSelect
      }),
      this.prisma.db.assessmentAttempt.count({ where })
    ]);

    return toPage(items, total, pagination);
  }

  async getAttempt(id: string) {
    const attempt = await this.prisma.db.assessmentAttempt.findUnique({ where: { id }, select: attemptSelect });
    return requireRecord(attempt, "Attempt not found");
  }

  async startAttempt(input: CreateAttemptDto, actorUserId: string) {
    const assignment = await this.prisma.db.assessmentAssignment.findUnique({
      where: { id: requireText(input.assessmentAssignmentId, "assessmentAssignmentId") },
      select: { id: true, studentId: true, classId: true, status: true }
    });
    const resolvedAssignment = requireRecord(assignment, "Assignment not found");
    if (resolvedAssignment.status === "cancelled" || resolvedAssignment.status === "exempted") {
      throw new ConflictException("Cannot start an attempt for a cancelled or exempted assignment");
    }

    const studentId = resolvedAssignment.studentId ?? requireText(input.studentId, "studentId");
    if (resolvedAssignment.studentId && input.studentId && input.studentId !== resolvedAssignment.studentId) {
      throw new BadRequestException("studentId does not match the assignment");
    }
    if (resolvedAssignment.classId) {
      await this.assertStudentBelongsToClass(studentId, resolvedAssignment.classId);
    }

    const attempt = await this.prisma.db.$transaction(async (tx) => {
      const existingCount = await tx.assessmentAttempt.count({
        where: { assessmentAssignmentId: resolvedAssignment.id }
      });
      await tx.assessmentAttempt.updateMany({
        where: { assessmentAssignmentId: resolvedAssignment.id, isLatest: true },
        data: { isLatest: false }
      });
      await tx.assessmentAssignment.update({
        where: { id: resolvedAssignment.id },
        data: { status: "started" },
        select: { id: true }
      });
      return tx.assessmentAttempt.create({
        data: {
          assessmentAssignmentId: resolvedAssignment.id,
          studentId,
          attemptNumber: existingCount + 1,
          ...(input.rawImportPayload !== undefined ? { rawImportPayload: input.rawImportPayload } : {})
        } as never,
        select: attemptSelect
      });
    });
    await this.audit(actorUserId, "assessments.attempt.started", "assessmentAttempt", attempt.id);
    return attempt;
  }

  async updateAttempt(id: string, input: UpdateAttemptDto, actorUserId: string) {
    const maxScore = input.maxScore === undefined ? undefined : nullablePositiveNumber(input.maxScore, "maxScore");
    const rawScore = input.rawScore === undefined ? undefined : nullableNonNegativeNumber(input.rawScore, "rawScore");
    const attempt = await this.prisma.db.assessmentAttempt.update({
      where: { id },
      data: {
        ...(input.timeSpentSeconds !== undefined
          ? { timeSpentSeconds: nullableNonNegativeInteger(input.timeSpentSeconds, "timeSpentSeconds") }
          : {}),
        ...(rawScore !== undefined ? { rawScore } : {}),
        ...(maxScore !== undefined ? { maxScore } : {}),
        ...(input.percentageScore !== undefined
          ? { percentageScore: nullableNonNegativeNumber(input.percentageScore, "percentageScore") }
          : {}),
        ...(input.resultStatus !== undefined
          ? { resultStatus: enumValue(input.resultStatus, ["in_progress", "submitted", "marked", "needs_review"], "resultStatus") }
          : {}),
        ...(input.teacherComment !== undefined ? { teacherComment: emptyToNull(input.teacherComment) } : {}),
        ...(input.parentComment !== undefined ? { parentComment: emptyToNull(input.parentComment) } : {}),
        ...(input.rawImportPayload !== undefined ? { rawImportPayload: input.rawImportPayload } : {})
      } as never,
      select: attemptSelect
    });
    await this.audit(actorUserId, "assessments.attempt.updated", "assessmentAttempt", attempt.id);
    return attempt;
  }

  async submitAttempt(id: string, actorUserId: string) {
    const attempt = await this.recalculateAttempt(id, {
      resultStatus: "submitted",
      submittedAt: new Date()
    });
    await this.prisma.db.assessmentAssignment.update({
      where: { id: attempt.assessmentAssignmentId },
      data: { status: "submitted" },
      select: { id: true }
    });
    await this.audit(actorUserId, "assessments.attempt.submitted", "assessmentAttempt", attempt.id);
    return attempt;
  }

  async markAttempt(id: string, input: MarkAttemptDto, actorUserId: string) {
    if ((input.mode ?? "manual") === "auto") {
      await this.autoMarkAttemptResponses(id);
    }
    const attempt = await this.recalculateAttempt(id, {
      resultStatus: "marked",
      markedByUserId: actorUserId,
      ...(input.teacherComment !== undefined ? { teacherComment: emptyToNull(input.teacherComment) } : {}),
      ...(input.parentComment !== undefined ? { parentComment: emptyToNull(input.parentComment) } : {})
    });
    await this.updateBestAttempt(attempt.assessmentAssignmentId);
    await this.audit(actorUserId, "assessments.attempt.marked", "assessmentAttempt", attempt.id);
    return attempt;
  }

  private async assertStudentBelongsToClass(studentId: string, classId: string): Promise<void> {
    const placement = await this.prisma.db.studentPrimaryPlacement.findFirst({
      where: { studentId, classSectionId: classId, status: "active" },
      select: { id: true }
    });
    if (!placement) {
      throw new BadRequestException("studentId is not actively placed in this class");
    }
  }

  private async autoMarkAttemptResponses(assessmentAttemptId: string): Promise<void> {
    const responses = await this.prisma.db.studentResponse.findMany({
      where: { assessmentAttemptId },
      select: {
        id: true,
        selectedOptionId: true,
        responseText: true,
        marksAvailable: true,
        question: {
          select: {
            questionType: true,
            correctAnswer: true,
            options: { select: { id: true, isCorrect: true } }
          }
        }
      }
    });
    await Promise.all(
      responses.map((response) => {
        const marked = autoMarkResponse(
          response.question,
          response.selectedOptionId,
          response.responseText,
          response.marksAvailable
        );
        if (marked.isCorrect === undefined) {
          return Promise.resolve();
        }
        return this.prisma.db.studentResponse.update({
          where: { id: response.id },
          data: marked,
          select: { id: true }
        });
      })
    );
  }

  private async recalculateAttempt(
    assessmentAttemptId: string,
    overrides: {
      resultStatus?: string;
      submittedAt?: Date;
      markedByUserId?: string;
      teacherComment?: string | null;
      parentComment?: string | null;
    } = {}
  ) {
    const responses = await this.prisma.db.studentResponse.findMany({
      where: { assessmentAttemptId },
      select: { marksAwarded: true, marksAvailable: true }
    });
    const rawScore = responses.reduce((sum, response) => sum + (response.marksAwarded ?? 0), 0);
    const maxScore = responses.reduce((sum, response) => sum + response.marksAvailable, 0);
    const percentageScore = maxScore > 0 ? (rawScore / maxScore) * 100 : null;

    return this.prisma.db.assessmentAttempt.update({
      where: { id: assessmentAttemptId },
      data: {
        rawScore,
        maxScore,
        percentageScore,
        ...(overrides.resultStatus ? { resultStatus: overrides.resultStatus } : {}),
        ...(overrides.submittedAt ? { submittedAt: overrides.submittedAt } : {}),
        ...(overrides.markedByUserId ? { markedByUserId: overrides.markedByUserId } : {}),
        ...(overrides.teacherComment !== undefined ? { teacherComment: overrides.teacherComment } : {}),
        ...(overrides.parentComment !== undefined ? { parentComment: overrides.parentComment } : {})
      } as never,
      select: attemptSelect
    });
  }

  private async updateBestAttempt(assessmentAssignmentId: string): Promise<void> {
    const bestAttempt = await this.prisma.db.assessmentAttempt.findFirst({
      where: { assessmentAssignmentId, rawScore: { not: null } },
      orderBy: [{ rawScore: "desc" }, { submittedAt: "asc" }],
      select: { id: true }
    });
    await this.prisma.db.assessmentAttempt.updateMany({
      where: { assessmentAssignmentId },
      data: { isBest: false }
    });
    if (bestAttempt) {
      await this.prisma.db.assessmentAttempt.update({
        where: { id: bestAttempt.id },
        data: { isBest: true },
        select: { id: true }
      });
    }
  }
}
