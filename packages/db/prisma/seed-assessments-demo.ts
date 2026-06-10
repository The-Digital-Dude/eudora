import type { PrismaClient } from "../src/client.js";

export type SeedAssessmentsDemoResult = {
  adminEmail: string;
  campusCode: string;
  academicYearCode: string;
  termCode: string;
  classSectionCode: string;
  studentNumber: string;
  assessmentTitle: string;
  assignmentStatus: string;
  attemptScore: string;
};

export type SeedAssessmentsDemoPrisma = Pick<
  PrismaClient,
  | "user"
  | "campus"
  | "program"
  | "academicYear"
  | "term"
  | "classSection"
  | "studentProfile"
  | "studentPrimaryPlacement"
  | "assessmentType"
  | "subject"
  | "assessmentLevel"
  | "assessment"
  | "assessmentSection"
  | "question"
  | "questionOption"
  | "assessmentQuestion"
  | "assessmentAssignment"
  | "assessmentAttempt"
  | "studentResponse"
  | "auditLog"
>;

const demo = {
  campus: { code: "DEMO-MAIN", name: "Demo Main Campus" },
  program: { code: "DEMO-PRIMARY", name: "Demo Primary Program" },
  academicYear: {
    code: "DEMO-AY-2026",
    name: "Demo Academic Year 2026-2027",
    startsOn: new Date("2026-08-01T00:00:00.000Z"),
    endsOn: new Date("2027-06-30T00:00:00.000Z")
  },
  term: {
    code: "DEMO-T2-2026",
    name: "Demo Term 2",
    startsOn: new Date("2026-10-01T00:00:00.000Z"),
    endsOn: new Date("2026-12-15T00:00:00.000Z")
  },
  classSection: { code: "DEMO-L5-A", name: "Demo Level 5 A", capacity: 24 },
  student: {
    studentNumber: "DEMO-STU-ASM-001",
    firstName: "Aria",
    lastName: "Rahman",
    dateOfBirth: new Date("2015-05-12T00:00:00.000Z")
  },
  assessmentTitle: "Week 4 Level 5 Maths Fractions Assessment"
};

export async function seedAssessmentsDemo(prisma: SeedAssessmentsDemoPrisma): Promise<SeedAssessmentsDemoResult> {
  const admin = await prisma.user.findFirst({
    where: {
      roles: {
        some: {
          role: { key: "superadmin" }
        }
      }
    },
    orderBy: { createdAt: "asc" },
    select: { id: true, email: true }
  });

  if (!admin) {
    throw new Error("Cannot seed assessment demo before a superadmin user exists");
  }

  const { campus, academicYear, term, classSection, student } = await ensureEducationScaffold(prisma);
  const weeklyType = await prisma.assessmentType.upsert({
    where: { code: "weekly" },
    update: { name: "Weekly Assessment", status: "active" },
    create: { code: "weekly", name: "Weekly Assessment" },
    select: { id: true, code: true }
  });
  await prisma.assessmentType.upsert({
    where: { code: "diagnostic" },
    update: { name: "Diagnostic Assessment", status: "active" },
    create: { code: "diagnostic", name: "Diagnostic Assessment" },
    select: { id: true }
  });

  const maths = await prisma.subject.upsert({
    where: { code: "maths" },
    update: { name: "Maths", status: "active" },
    create: { code: "maths", name: "Maths" },
    select: { id: true, code: true }
  });
  await Promise.all(
    ([
      ["english", "English"],
      ["oc", "OC"],
      ["selective", "Selective"]
    ] as const).map(([code, name]) =>
      prisma.subject.upsert({
        where: { code },
        update: { name, status: "active" },
        create: { code, name },
        select: { id: true }
      })
    )
  );

  const level5 = await prisma.assessmentLevel.upsert({
    where: { code: "level-5" },
    update: { name: "Level 5", sortOrder: 5, status: "active" },
    create: { code: "level-5", name: "Level 5", sortOrder: 5 },
    select: { id: true, code: true }
  });
  await Promise.all(
    [
      ["level-3", "Level 3", 3],
      ["level-4", "Level 4", 4],
      ["year-5", "Year 5", 50]
    ].map(([code, name, sortOrder]) =>
      prisma.assessmentLevel.upsert({
        where: { code: String(code) },
        update: { name: String(name), sortOrder: Number(sortOrder), status: "active" },
        create: { code: String(code), name: String(name), sortOrder: Number(sortOrder) },
        select: { id: true }
      })
    )
  );

  const assessment = await upsertAssessment(prisma, {
    assessmentTypeId: weeklyType.id,
    subjectId: maths.id,
    levelId: level5.id,
    termId: term.id
  });
  const sections = await ensureAssessmentSections(prisma, assessment.id);
  const questions = await ensureQuestions(prisma, maths.id, level5.id);

  await Promise.all(
    questions.map((question, index) =>
      prisma.assessmentQuestion.upsert({
        where: { assessmentId_questionId: { assessmentId: assessment.id, questionId: question.id } },
        update: {
          questionNumber: index + 1,
          marksAvailable: question.marksAvailable,
          sectionId: index < 3 ? sections.number.id : sections.reasoning.id
        },
        create: {
          assessmentId: assessment.id,
          questionId: question.id,
          questionNumber: index + 1,
          marksAvailable: question.marksAvailable,
          sectionId: index < 3 ? sections.number.id : sections.reasoning.id
        },
        select: { id: true }
      })
    )
  );

  const studentAssignment = await ensureAssignment(prisma, {
    assessmentId: assessment.id,
    studentId: student.id,
    classId: null,
    assignedByUserId: admin.id
  });
  await ensureAssignment(prisma, {
    assessmentId: assessment.id,
    studentId: null,
    classId: classSection.id,
    assignedByUserId: admin.id
  });

  const attempt = await prisma.assessmentAttempt.upsert({
    where: { assessmentAssignmentId_attemptNumber: { assessmentAssignmentId: studentAssignment.id, attemptNumber: 1 } },
    update: {
      studentId: student.id,
      startedAt: new Date("2026-10-28T09:00:00.000Z"),
      submittedAt: new Date("2026-10-28T09:38:00.000Z"),
      timeSpentSeconds: 2280,
      rawScore: 14,
      maxScore: 20,
      percentageScore: 70,
      resultStatus: "marked",
      isLatest: true,
      isBest: true,
      markedByUserId: admin.id,
      teacherComment: "Good foundational understanding. Needs practice on worded fraction problems.",
      parentComment: "Aria has a solid start with equivalent fractions and should practise word problems."
    },
    create: {
      assessmentAssignmentId: studentAssignment.id,
      studentId: student.id,
      attemptNumber: 1,
      startedAt: new Date("2026-10-28T09:00:00.000Z"),
      submittedAt: new Date("2026-10-28T09:38:00.000Z"),
      timeSpentSeconds: 2280,
      rawScore: 14,
      maxScore: 20,
      percentageScore: 70,
      resultStatus: "marked",
      isLatest: true,
      isBest: true,
      markedByUserId: admin.id,
      teacherComment: "Good foundational understanding. Needs practice on worded fraction problems.",
      parentComment: "Aria has a solid start with equivalent fractions and should practise word problems."
    },
    select: { id: true }
  });

  await ensureResponses(prisma, attempt.id, questions);
  await prisma.auditLog.create({
    data: {
      actorUserId: admin.id,
      event: "seed.assessmentsDemo.ensured",
      targetType: "assessment",
      targetId: assessment.id,
      metadata: {
        studentId: student.id,
        classSectionId: classSection.id,
        termId: term.id
      }
    }
  });

  return {
    adminEmail: admin.email,
    campusCode: campus.code,
    academicYearCode: academicYear.code,
    termCode: term.code,
    classSectionCode: classSection.code,
    studentNumber: student.studentNumber,
    assessmentTitle: assessment.title,
    assignmentStatus: studentAssignment.status,
    attemptScore: "14/20"
  };
}

async function ensureEducationScaffold(prisma: SeedAssessmentsDemoPrisma) {
  const campus = await prisma.campus.upsert({
    where: { code: demo.campus.code },
    update: { name: demo.campus.name, status: "active" },
    create: { code: demo.campus.code, name: demo.campus.name },
    select: { id: true, code: true }
  });
  const program = await prisma.program.upsert({
    where: { campusId_code: { campusId: campus.id, code: demo.program.code } },
    update: { name: demo.program.name, status: "active" },
    create: { campusId: campus.id, code: demo.program.code, name: demo.program.name },
    select: { id: true, code: true }
  });
  const academicYear = await prisma.academicYear.upsert({
    where: { code: demo.academicYear.code },
    update: {
      name: demo.academicYear.name,
      startsOn: demo.academicYear.startsOn,
      endsOn: demo.academicYear.endsOn,
      isActive: true
    },
    create: { ...demo.academicYear, isActive: true },
    select: { id: true, code: true }
  });
  const term = await prisma.term.upsert({
    where: { academicYearId_code: { academicYearId: academicYear.id, code: demo.term.code } },
    update: { name: demo.term.name, startsOn: demo.term.startsOn, endsOn: demo.term.endsOn },
    create: {
      academicYearId: academicYear.id,
      code: demo.term.code,
      name: demo.term.name,
      startsOn: demo.term.startsOn,
      endsOn: demo.term.endsOn
    },
    select: { id: true, code: true }
  });
  const classSection = await prisma.classSection.upsert({
    where: {
      campusId_academicYearId_code: {
        campusId: campus.id,
        academicYearId: academicYear.id,
        code: demo.classSection.code
      }
    },
    update: {
      programId: program.id,
      termId: term.id,
      name: demo.classSection.name,
      capacity: demo.classSection.capacity,
      status: "active"
    },
    create: {
      campusId: campus.id,
      programId: program.id,
      academicYearId: academicYear.id,
      termId: term.id,
      code: demo.classSection.code,
      name: demo.classSection.name,
      capacity: demo.classSection.capacity
    },
    select: { id: true, code: true }
  });
  const student = await prisma.studentProfile.upsert({
    where: { studentNumber: demo.student.studentNumber },
    update: {
      firstName: demo.student.firstName,
      lastName: demo.student.lastName,
      dateOfBirth: demo.student.dateOfBirth,
      status: "active"
    },
    create: demo.student,
    select: { id: true, studentNumber: true }
  });

  const placement = await prisma.studentPrimaryPlacement.findFirst({
    where: { studentId: student.id, academicYearId: academicYear.id, status: "active" },
    select: { id: true }
  });

  if (placement) {
    await prisma.studentPrimaryPlacement.update({
      where: { id: placement.id },
      data: {
        classSectionId: classSection.id,
        startsOn: demo.academicYear.startsOn,
        endsOn: null,
        status: "active"
      },
      select: { id: true }
    });
  } else {
    await prisma.studentPrimaryPlacement.create({
      data: {
        studentId: student.id,
        classSectionId: classSection.id,
        academicYearId: academicYear.id,
        startsOn: demo.academicYear.startsOn,
        status: "active"
      },
      select: { id: true }
    });
  }

  return { campus, program, academicYear, term, classSection, student };
}

async function upsertAssessment(
  prisma: SeedAssessmentsDemoPrisma,
  input: { assessmentTypeId: string; subjectId: string; levelId: string; termId: string }
) {
  const existing = await prisma.assessment.findFirst({
    where: { title: demo.assessmentTitle, termId: input.termId },
    select: { id: true }
  });
  const data = {
    assessmentTypeId: input.assessmentTypeId,
    subjectId: input.subjectId,
    levelId: input.levelId,
    termId: input.termId,
    weekNumber: 4,
    title: demo.assessmentTitle,
    totalMarks: 20,
    estimatedDurationMinutes: 45,
    status: "published" as const,
    publishedAt: new Date("2026-10-20T00:00:00.000Z")
  };

  return existing
    ? prisma.assessment.update({ where: { id: existing.id }, data, select: { id: true, title: true } })
    : prisma.assessment.create({ data, select: { id: true, title: true } });
}

async function ensureAssessmentSections(prisma: SeedAssessmentsDemoPrisma, assessmentId: string) {
  const number = await prisma.assessmentSection.upsert({
    where: { assessmentId_sortOrder: { assessmentId, sortOrder: 1 } },
    update: { title: "Number" },
    create: { assessmentId, title: "Number", sortOrder: 1 },
    select: { id: true }
  });
  const reasoning = await prisma.assessmentSection.upsert({
    where: { assessmentId_sortOrder: { assessmentId, sortOrder: 2 } },
    update: { title: "Reasoning" },
    create: { assessmentId, title: "Reasoning", sortOrder: 2 },
    select: { id: true }
  });

  return { number, reasoning };
}

async function ensureQuestions(prisma: SeedAssessmentsDemoPrisma, subjectId: string, levelId: string) {
  const questionInputs = [
    {
      prompt: "Which fraction is equivalent to 1/2?",
      questionType: "mcq" as const,
      correctAnswer: null,
      difficulty: "medium" as const,
      marksAvailable: 2,
      selectedLabel: "A",
      responseText: null,
      isCorrect: true,
      marksAwarded: 2,
      options: [
        ["A", "2/4", true],
        ["B", "1/3", false],
        ["C", "3/5", false],
        ["D", "4/7", false]
      ]
    },
    {
      prompt: "Write 3/6 in its simplest form.",
      questionType: "short_answer" as const,
      correctAnswer: "1/2",
      difficulty: "easy" as const,
      marksAvailable: 3,
      selectedLabel: null,
      responseText: "1/2",
      isCorrect: true,
      marksAwarded: 3,
      options: []
    },
    {
      prompt: "What is 1/4 + 2/4?",
      questionType: "short_answer" as const,
      correctAnswer: "3/4",
      difficulty: "medium" as const,
      marksAvailable: 4,
      selectedLabel: null,
      responseText: "3/4",
      isCorrect: true,
      marksAwarded: 4,
      options: []
    },
    {
      prompt: "Order these fractions from smallest to largest: 2/3, 1/2, 3/4.",
      questionType: "written" as const,
      correctAnswer: "1/2, 2/3, 3/4",
      difficulty: "hard" as const,
      marksAvailable: 5,
      selectedLabel: null,
      responseText: "1/2, 3/4, 2/3",
      isCorrect: false,
      marksAwarded: 2,
      options: []
    },
    {
      prompt: "A cake is cut into 8 equal pieces. Sam eats 3 pieces and Jo eats 2 pieces. What fraction is left?",
      questionType: "written" as const,
      correctAnswer: "3/8",
      difficulty: "extension" as const,
      marksAvailable: 6,
      selectedLabel: null,
      responseText: "2/8",
      isCorrect: false,
      marksAwarded: 3,
      options: []
    }
  ];

  const questions = [];
  for (const input of questionInputs) {
    const existing = await prisma.question.findFirst({
      where: { prompt: input.prompt },
      select: { id: true }
    });
    const data = {
      subjectId,
      levelId,
      questionType: input.questionType,
      prompt: input.prompt,
      correctAnswer: input.correctAnswer,
      difficulty: input.difficulty,
      status: "active" as const
    };
    const question = existing
      ? await prisma.question.update({ where: { id: existing.id }, data, select: { id: true } })
      : await prisma.question.create({ data, select: { id: true } });

    const options = [];
    for (const [optionLabel, optionText, isCorrect] of input.options) {
      const option = await prisma.questionOption.upsert({
        where: { questionId_optionLabel: { questionId: question.id, optionLabel: String(optionLabel) } },
        update: { optionText: String(optionText), isCorrect: Boolean(isCorrect) },
        create: {
          questionId: question.id,
          optionLabel: String(optionLabel),
          optionText: String(optionText),
          isCorrect: Boolean(isCorrect)
        },
        select: { id: true, optionLabel: true }
      });
      options.push(option);
    }

    questions.push({
      id: question.id,
      marksAvailable: input.marksAvailable,
      selectedOptionId: input.selectedLabel
        ? options.find((option) => option.optionLabel === input.selectedLabel)?.id ?? null
        : null,
      responseText: input.responseText,
      isCorrect: input.isCorrect,
      marksAwarded: input.marksAwarded
    });
  }

  return questions;
}

async function ensureAssignment(
  prisma: SeedAssessmentsDemoPrisma,
  input: { assessmentId: string; studentId: string | null; classId: string | null; assignedByUserId: string }
) {
  const existing = await prisma.assessmentAssignment.findFirst({
    where: {
      assessmentId: input.assessmentId,
      studentId: input.studentId,
      classId: input.classId
    },
    select: { id: true }
  });
  const data = {
    assessmentId: input.assessmentId,
    studentId: input.studentId,
    classId: input.classId,
    assignedByUserId: input.assignedByUserId,
    opensAt: new Date("2026-10-21T09:00:00.000Z"),
    dueAt: new Date("2026-10-31T23:59:00.000Z"),
    status: input.studentId ? ("submitted" as const) : ("assigned" as const),
    reminderCount: input.studentId ? 1 : 0
  };

  return existing
    ? prisma.assessmentAssignment.update({ where: { id: existing.id }, data, select: { id: true, status: true } })
    : prisma.assessmentAssignment.create({ data, select: { id: true, status: true } });
}

async function ensureResponses(
  prisma: SeedAssessmentsDemoPrisma,
  assessmentAttemptId: string,
  questions: Array<{
    id: string;
    marksAvailable: number;
    selectedOptionId: string | null;
    responseText: string | null;
    isCorrect: boolean;
    marksAwarded: number;
  }>
): Promise<void> {
  await Promise.all(
    questions.map((question, index) =>
      prisma.studentResponse.upsert({
        where: { assessmentAttemptId_questionId: { assessmentAttemptId, questionId: question.id } },
        update: {
          selectedOptionId: question.selectedOptionId,
          responseText: question.responseText,
          isCorrect: question.isCorrect,
          marksAwarded: question.marksAwarded,
          marksAvailable: question.marksAvailable,
          timeSpentSeconds: 120 + index * 45,
          feedback: question.isCorrect ? "Correct." : "Review this concept before reassessment."
        },
        create: {
          assessmentAttemptId,
          questionId: question.id,
          selectedOptionId: question.selectedOptionId,
          responseText: question.responseText,
          isCorrect: question.isCorrect,
          marksAwarded: question.marksAwarded,
          marksAvailable: question.marksAvailable,
          timeSpentSeconds: 120 + index * 45,
          feedback: question.isCorrect ? "Correct." : "Review this concept before reassessment."
        },
        select: { id: true }
      })
    )
  );
}
