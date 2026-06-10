import { BadRequestException, Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service.js";
import {
  AddAssessmentQuestionDto,
  CreateQuestionDto,
  ListQuestionsQueryDto,
  UpdateAssessmentQuestionDto,
  UpdateQuestionDto
} from "./assessments.dto.js";
import {
  AssessmentDomainService,
  type PrismaAccess,
  assertPositiveInteger,
  assertPositiveNumber,
  emptyToNull,
  enumFilter,
  enumValue,
  idFilter,
  normalizeOptions,
  normalizePagination,
  questionSelect,
  requireRecord,
  requireText,
  searchFilter,
  toPage
} from "./assessments.common.js";

@Injectable()
export class QuestionsService extends AssessmentDomainService {
  constructor(@Inject(PrismaService) prisma: PrismaAccess) {
    super(prisma);
  }

  async listQuestions(query: ListQuestionsQueryDto = {}) {
    const pagination = normalizePagination(query);
    const where = {
      ...searchFilter(query.search, ["prompt", "correctAnswer"]),
      ...idFilter("subjectId", query.subjectId),
      ...idFilter("levelId", query.levelId),
      ...enumFilter("questionType", query.questionType, ["mcq", "short_answer", "numeric", "written"]),
      ...enumFilter("difficulty", query.difficulty, ["easy", "medium", "hard", "extension"]),
      ...enumFilter("status", query.status, ["draft", "active", "archived"])
    };
    const [items, total] = await Promise.all([
      this.prisma.db.question.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.pageSize,
        select: questionSelect
      }),
      this.prisma.db.question.count({ where })
    ]);

    return toPage(items, total, pagination);
  }

  async getQuestion(id: string) {
    const question = await this.prisma.db.question.findUnique({ where: { id }, select: questionSelect });
    return requireRecord(question, "Question not found");
  }

  async createQuestion(input: CreateQuestionDto, actorUserId: string) {
    const questionType = enumValue(input.questionType, ["mcq", "short_answer", "numeric", "written"], "questionType");
    const difficulty = enumValue(input.difficulty, ["easy", "medium", "hard", "extension"], "difficulty");
    const options = normalizeOptions(input.options ?? [], questionType);
    const question = await this.prisma.db.question.create({
      data: {
        subjectId: emptyToNull(input.subjectId),
        levelId: emptyToNull(input.levelId),
        questionType,
        prompt: requireText(input.prompt, "prompt"),
        correctAnswer: emptyToNull(input.correctAnswer),
        difficulty,
        status: enumValue(input.status ?? "draft", ["draft", "active", "archived"], "status"),
        ...(options.length > 0 ? { options: { create: options } } : {})
      } as never,
      select: questionSelect
    });
    await this.audit(actorUserId, "assessments.question.created", "question", question.id);
    return question;
  }

  async updateQuestion(id: string, input: UpdateQuestionDto, actorUserId: string) {
    const questionType = input.questionType
      ? enumValue(input.questionType, ["mcq", "short_answer", "numeric", "written"], "questionType")
      : undefined;
    let effectiveQuestionType = questionType;
    if (input.options && !effectiveQuestionType) {
      const existingQuestion = await this.prisma.db.question.findUnique({
        where: { id },
        select: { questionType: true }
      });
      effectiveQuestionType = requireRecord(existingQuestion, "Question not found").questionType;
    }
    const options = input.options ? normalizeOptions(input.options, effectiveQuestionType ?? "mcq") : undefined;
    const question = await this.prisma.db.$transaction(async (tx) => {
      if (options) {
        await tx.questionOption.deleteMany({ where: { questionId: id } });
      }
      return tx.question.update({
        where: { id },
        data: {
          ...(input.subjectId !== undefined ? { subjectId: emptyToNull(input.subjectId) } : {}),
          ...(input.levelId !== undefined ? { levelId: emptyToNull(input.levelId) } : {}),
          ...(questionType !== undefined ? { questionType } : {}),
          ...(input.prompt !== undefined ? { prompt: requireText(input.prompt, "prompt") } : {}),
          ...(input.correctAnswer !== undefined ? { correctAnswer: emptyToNull(input.correctAnswer) } : {}),
          ...(input.difficulty !== undefined
            ? { difficulty: enumValue(input.difficulty, ["easy", "medium", "hard", "extension"], "difficulty") }
            : {}),
          ...(input.status !== undefined
            ? { status: enumValue(input.status, ["draft", "active", "archived"], "status") }
            : {}),
          ...(options ? { options: { create: options } } : {})
        } as never,
        select: questionSelect
      });
    });
    await this.audit(actorUserId, "assessments.question.updated", "question", question.id);
    return question;
  }

  async archiveQuestion(id: string, actorUserId: string) {
    const question = await this.prisma.db.question.update({
      where: { id },
      data: { status: "archived" },
      select: questionSelect
    });
    await this.audit(actorUserId, "assessments.question.archived", "question", question.id);
    return question;
  }

  async addQuestionToAssessment(assessmentId: string, input: AddAssessmentQuestionDto, actorUserId: string) {
    await this.assertSectionBelongsToAssessment(assessmentId, input.sectionId);
    assertPositiveInteger(input.questionNumber, "questionNumber");
    assertPositiveNumber(input.marksAvailable, "marksAvailable");
    const assessmentQuestion = await this.prisma.db.assessmentQuestion.create({
      data: {
        assessmentId,
        questionId: requireText(input.questionId, "questionId"),
        questionNumber: input.questionNumber,
        marksAvailable: input.marksAvailable,
        sectionId: emptyToNull(input.sectionId)
      },
      select: { id: true, assessmentId: true, questionId: true, questionNumber: true, marksAvailable: true, sectionId: true }
    });
    await this.audit(actorUserId, "assessments.assessmentQuestion.created", "assessment", assessmentId);
    return assessmentQuestion;
  }

  async updateAssessmentQuestion(
    assessmentId: string,
    questionId: string,
    input: UpdateAssessmentQuestionDto,
    actorUserId: string
  ) {
    await this.assertSectionBelongsToAssessment(assessmentId, input.sectionId);
    if (input.questionNumber !== undefined) {
      assertPositiveInteger(input.questionNumber, "questionNumber");
    }
    if (input.marksAvailable !== undefined) {
      assertPositiveNumber(input.marksAvailable, "marksAvailable");
    }
    const assessmentQuestion = await this.prisma.db.assessmentQuestion.update({
      where: { assessmentId_questionId: { assessmentId, questionId } },
      data: {
        ...(input.questionNumber !== undefined ? { questionNumber: input.questionNumber } : {}),
        ...(input.marksAvailable !== undefined ? { marksAvailable: input.marksAvailable } : {}),
        ...(input.sectionId !== undefined ? { sectionId: emptyToNull(input.sectionId) } : {})
      },
      select: { id: true, assessmentId: true, questionId: true, questionNumber: true, marksAvailable: true, sectionId: true }
    });
    await this.audit(actorUserId, "assessments.assessmentQuestion.updated", "assessment", assessmentId);
    return assessmentQuestion;
  }

  async removeQuestionFromAssessment(assessmentId: string, questionId: string, actorUserId: string) {
    const assessmentQuestion = await this.prisma.db.assessmentQuestion.delete({
      where: { assessmentId_questionId: { assessmentId, questionId } },
      select: { id: true, assessmentId: true, questionId: true }
    });
    await this.audit(actorUserId, "assessments.assessmentQuestion.removed", "assessment", assessmentId);
    return assessmentQuestion;
  }

  private async assertSectionBelongsToAssessment(assessmentId: string, sectionId: string | null | undefined): Promise<void> {
    const resolvedSectionId = emptyToNull(sectionId);
    if (!resolvedSectionId) {
      return;
    }
    const section = await this.prisma.db.assessmentSection.findFirst({
      where: { id: resolvedSectionId, assessmentId },
      select: { id: true }
    });
    if (!section) {
      throw new BadRequestException("sectionId does not belong to this assessment");
    }
  }
}
