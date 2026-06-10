import { applyDecorators } from "@nestjs/common";
import { ApiQuery } from "@nestjs/swagger";

export function PaginationQueries(): MethodDecorator {
  return applyDecorators(
    ApiQuery({ name: "page", required: false, type: Number, example: 1, description: "1-based page number." }),
    ApiQuery({ name: "pageSize", required: false, type: Number, example: 25, description: "Items per page. Max 100." })
  );
}

export function LookupQueries(): MethodDecorator {
  return applyDecorators(
    ApiQuery({ name: "search", required: false, type: String, description: "Case-insensitive search against code and name." }),
    ApiQuery({ name: "status", required: false, enum: ["active", "inactive", "archived"] }),
    PaginationQueries()
  );
}

export function AssessmentListQueries(): MethodDecorator {
  return applyDecorators(
    ApiQuery({ name: "search", required: false, type: String, description: "Case-insensitive search against assessment title." }),
    ApiQuery({ name: "assessmentTypeId", required: false, type: String }),
    ApiQuery({ name: "subjectId", required: false, type: String }),
    ApiQuery({ name: "levelId", required: false, type: String }),
    ApiQuery({ name: "termId", required: false, type: String }),
    ApiQuery({ name: "weekNumber", required: false, type: Number, example: 4 }),
    ApiQuery({ name: "status", required: false, enum: ["draft", "published", "archived"] }),
    PaginationQueries()
  );
}

export function QuestionListQueries(): MethodDecorator {
  return applyDecorators(
    ApiQuery({ name: "search", required: false, type: String, description: "Case-insensitive search against prompt and correct answer." }),
    ApiQuery({ name: "subjectId", required: false, type: String }),
    ApiQuery({ name: "levelId", required: false, type: String }),
    ApiQuery({ name: "questionType", required: false, enum: ["mcq", "short_answer", "numeric", "written"] }),
    ApiQuery({ name: "difficulty", required: false, enum: ["easy", "medium", "hard", "extension"] }),
    ApiQuery({ name: "status", required: false, enum: ["draft", "active", "archived"] }),
    PaginationQueries()
  );
}

export function AssignmentListQueries(hidden: string[] = []): MethodDecorator {
  return applyDecorators(
    ...[
      hidden.includes("assessmentId") ? null : ApiQuery({ name: "assessmentId", required: false, type: String }),
      hidden.includes("studentId") ? null : ApiQuery({ name: "studentId", required: false, type: String }),
      hidden.includes("classId") ? null : ApiQuery({ name: "classId", required: false, type: String }),
      ApiQuery({ name: "status", required: false, enum: ["assigned", "started", "submitted", "overdue", "exempted", "cancelled"] }),
      PaginationQueries()
    ].filter(isMethodDecorator)
  );
}

export function AttemptListQueries(hidden: string[] = []): MethodDecorator {
  return applyDecorators(
    ...[
      hidden.includes("assessmentAssignmentId") ? null : ApiQuery({ name: "assessmentAssignmentId", required: false, type: String }),
      hidden.includes("studentId") ? null : ApiQuery({ name: "studentId", required: false, type: String }),
      ApiQuery({ name: "resultStatus", required: false, enum: ["in_progress", "submitted", "marked", "needs_review"] }),
      PaginationQueries()
    ].filter(isMethodDecorator)
  );
}

export function ResponseListQueries(hidden: string[] = []): MethodDecorator {
  return applyDecorators(
    ...[
      hidden.includes("assessmentAttemptId") ? null : ApiQuery({ name: "assessmentAttemptId", required: false, type: String }),
      hidden.includes("questionId") ? null : ApiQuery({ name: "questionId", required: false, type: String }),
      PaginationQueries()
    ].filter(isMethodDecorator)
  );
}

function isMethodDecorator(value: MethodDecorator | null): value is MethodDecorator {
  return value !== null;
}
