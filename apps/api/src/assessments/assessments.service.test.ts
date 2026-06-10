import { BadRequestException, ConflictException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { AssessmentSetupService } from "./assessment-setup.service.js";
import { AssignmentsService } from "./assignments.service.js";
import { AttemptsService } from "./attempts.service.js";
import { QuestionsService } from "./questions.service.js";
import { StudentResponsesService } from "./student-responses.service.js";

function createPrismaMock() {
  return {
    db: {
      assessmentQuestion: {
        count: vi.fn()
      },
      assessmentType: {
        create: vi.fn(),
        findUnique: vi.fn()
      },
      assessmentAssignment: {
        create: vi.fn(),
        findUnique: vi.fn()
      },
      assessmentAttempt: {
        findUnique: vi.fn()
      },
      question: {
        findUnique: vi.fn(),
        create: vi.fn()
      },
      studentPrimaryPlacement: {
        findFirst: vi.fn()
      },
      studentResponse: {
        findUnique: vi.fn(),
        update: vi.fn()
      },
      auditLog: {
        create: vi.fn()
      },
      $transaction: vi.fn()
    }
  };
}

describe("assessment domain services", () => {
  it("rejects publishing an assessment without questions", async () => {
    const prisma = createPrismaMock();
    prisma.db.assessmentQuestion.count.mockResolvedValue(0);
    const service = new AssessmentSetupService(prisma as never);

    await expect(service.publishAssessment("assessment_1", "user_1")).rejects.toBeInstanceOf(ConflictException);
  });

  it("rejects duplicate assessment type codes with a clear conflict", async () => {
    const prisma = createPrismaMock();
    prisma.db.assessmentType.findUnique.mockResolvedValue({ id: "type_weekly" });
    const service = new AssessmentSetupService(prisma as never);

    await expect(
      service.createAssessmentType({ code: "weekly", name: "Weekly Assessment" }, "user_1")
    ).rejects.toThrow("Assessment type code already exists");
    expect(prisma.db.assessmentType.create).not.toHaveBeenCalled();
  });

  it("rejects MCQ questions without a correct option", async () => {
    const prisma = createPrismaMock();
    const service = new QuestionsService(prisma as never);

    await expect(
      service.createQuestion(
        {
          questionType: "mcq",
          prompt: "Which fraction is equivalent to 1/2?",
          difficulty: "medium",
          options: [
            { optionLabel: "A", optionText: "1/3" },
            { optionLabel: "B", optionText: "2/5" }
          ]
        },
        "user_1"
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("requires exactly one assignment target", async () => {
    const prisma = createPrismaMock();
    const service = new AssignmentsService(prisma as never);

    await expect(
      service.createAssignment({ assessmentId: "assessment_1", studentId: "student_1", classId: "class_1" }, "user_1")
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects class attempts when the student is not actively placed in that class", async () => {
    const prisma = createPrismaMock();
    prisma.db.assessmentAssignment.findUnique.mockResolvedValue({
      id: "assignment_1",
      studentId: null,
      classId: "class_1",
      status: "assigned"
    });
    prisma.db.studentPrimaryPlacement.findFirst.mockResolvedValue(null);
    const service = new AttemptsService(prisma as never);

    await expect(
      service.startAttempt({ assessmentAssignmentId: "assignment_1", studentId: "student_1" }, "user_1")
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects response marks above the available marks", async () => {
    const prisma = createPrismaMock();
    prisma.db.studentResponse.findUnique.mockResolvedValue({
      marksAvailable: 2,
      assessmentAttemptId: "attempt_1"
    });
    const service = new StudentResponsesService(prisma as never);

    await expect(service.markResponse("response_1", { marksAwarded: 3 }, "user_1")).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it("uses the existing question type when replacing options without questionType", async () => {
    const prisma = createPrismaMock();
    prisma.db.question.findUnique.mockResolvedValue({ questionType: "written" });
    prisma.db.$transaction.mockImplementation((callback: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        questionOption: { deleteMany: vi.fn() },
        question: {
          update: vi.fn().mockResolvedValue({
            id: "question_1",
            questionType: "written",
            options: [{ optionLabel: "A", optionText: "Rubric point", isCorrect: false }]
          })
        }
      };
      return callback(tx);
    });
    const service = new QuestionsService(prisma as never);

    await expect(
      service.updateQuestion(
        "question_1",
        {
          options: [{ optionLabel: "A", optionText: "Rubric point" }]
        },
        "user_1"
      )
    ).resolves.toMatchObject({ id: "question_1", questionType: "written" });
  });
});
