import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ListAssessmentsQueryDto {
  @ApiPropertyOptional()
  search?: string;

  @ApiPropertyOptional()
  assessmentTypeId?: string;

  @ApiPropertyOptional()
  subjectId?: string;

  @ApiPropertyOptional()
  levelId?: string;

  @ApiPropertyOptional()
  termId?: string;

  @ApiPropertyOptional({ example: 4 })
  weekNumber?: string;

  @ApiPropertyOptional({ enum: ["draft", "published", "archived"] })
  status?: string;

  @ApiPropertyOptional({ example: 1 })
  page?: string;

  @ApiPropertyOptional({ example: 25 })
  pageSize?: string;
}

export class LookupQueryDto {
  @ApiPropertyOptional()
  search?: string;

  @ApiPropertyOptional({ enum: ["active", "inactive", "archived"] })
  status?: string;

  @ApiPropertyOptional({ example: 1 })
  page?: string;

  @ApiPropertyOptional({ example: 25 })
  pageSize?: string;
}

export class CreateLookupDto {
  @ApiProperty({ example: "weekly" })
  code!: string;

  @ApiProperty({ example: "Weekly Assessment" })
  name!: string;

  @ApiPropertyOptional({ example: 5 })
  sortOrder?: number | null;
}

export class UpdateLookupDto {
  @ApiPropertyOptional()
  name?: string;

  @ApiPropertyOptional({ enum: ["active", "inactive", "archived"] })
  status?: string;

  @ApiPropertyOptional()
  sortOrder?: number | null;
}

export class CreateAssessmentSectionDto {
  @ApiProperty({ example: "Number and Algebra" })
  title!: string;

  @ApiProperty({ example: 1 })
  sortOrder!: number;
}

export class CreateAssessmentDto {
  @ApiProperty()
  assessmentTypeId!: string;

  @ApiProperty()
  subjectId!: string;

  @ApiProperty()
  levelId!: string;

  @ApiProperty()
  termId!: string;

  @ApiPropertyOptional({ example: 4 })
  weekNumber?: number | null;

  @ApiProperty({ example: "Week 4 Level 5 Maths Fractions Assessment" })
  title!: string;

  @ApiProperty({ example: 20 })
  totalMarks!: number;

  @ApiPropertyOptional({ example: 45 })
  estimatedDurationMinutes?: number | null;

  @ApiPropertyOptional({ type: [CreateAssessmentSectionDto] })
  sections?: CreateAssessmentSectionDto[];
}

export class UpdateAssessmentDto {
  @ApiPropertyOptional()
  assessmentTypeId?: string;

  @ApiPropertyOptional()
  subjectId?: string;

  @ApiPropertyOptional()
  levelId?: string;

  @ApiPropertyOptional()
  termId?: string;

  @ApiPropertyOptional({ example: 4 })
  weekNumber?: number | null;

  @ApiPropertyOptional()
  title?: string;

  @ApiPropertyOptional()
  totalMarks?: number;

  @ApiPropertyOptional()
  estimatedDurationMinutes?: number | null;

  @ApiPropertyOptional({ type: [CreateAssessmentSectionDto] })
  sections?: CreateAssessmentSectionDto[];
}

export class QuestionOptionDto {
  @ApiProperty({ example: "A" })
  optionLabel!: string;

  @ApiProperty({ example: "1/2" })
  optionText!: string;

  @ApiPropertyOptional({ example: false })
  isCorrect?: boolean;
}

export class ListQuestionsQueryDto {
  @ApiPropertyOptional()
  search?: string;

  @ApiPropertyOptional()
  subjectId?: string;

  @ApiPropertyOptional()
  levelId?: string;

  @ApiPropertyOptional({ enum: ["mcq", "short_answer", "numeric", "written"] })
  questionType?: string;

  @ApiPropertyOptional({ enum: ["easy", "medium", "hard", "extension"] })
  difficulty?: string;

  @ApiPropertyOptional({ enum: ["draft", "active", "archived"] })
  status?: string;

  @ApiPropertyOptional({ example: 1 })
  page?: string;

  @ApiPropertyOptional({ example: 25 })
  pageSize?: string;
}

export class CreateQuestionDto {
  @ApiPropertyOptional()
  subjectId?: string | null;

  @ApiPropertyOptional()
  levelId?: string | null;

  @ApiProperty({ enum: ["mcq", "short_answer", "numeric", "written"] })
  questionType!: string;

  @ApiProperty()
  prompt!: string;

  @ApiPropertyOptional()
  correctAnswer?: string | null;

  @ApiProperty({ enum: ["easy", "medium", "hard", "extension"] })
  difficulty!: string;

  @ApiPropertyOptional({ enum: ["draft", "active", "archived"] })
  status?: string;

  @ApiPropertyOptional({ type: [QuestionOptionDto] })
  options?: QuestionOptionDto[];
}

export class UpdateQuestionDto {
  @ApiPropertyOptional()
  subjectId?: string | null;

  @ApiPropertyOptional()
  levelId?: string | null;

  @ApiPropertyOptional({ enum: ["mcq", "short_answer", "numeric", "written"] })
  questionType?: string;

  @ApiPropertyOptional()
  prompt?: string;

  @ApiPropertyOptional()
  correctAnswer?: string | null;

  @ApiPropertyOptional({ enum: ["easy", "medium", "hard", "extension"] })
  difficulty?: string;

  @ApiPropertyOptional({ enum: ["draft", "active", "archived"] })
  status?: string;

  @ApiPropertyOptional({ type: [QuestionOptionDto] })
  options?: QuestionOptionDto[];
}

export class AddAssessmentQuestionDto {
  @ApiProperty()
  questionId!: string;

  @ApiProperty({ example: 1 })
  questionNumber!: number;

  @ApiProperty({ example: 2 })
  marksAvailable!: number;

  @ApiPropertyOptional()
  sectionId?: string | null;
}

export class UpdateAssessmentQuestionDto {
  @ApiPropertyOptional({ example: 1 })
  questionNumber?: number;

  @ApiPropertyOptional({ example: 2 })
  marksAvailable?: number;

  @ApiPropertyOptional()
  sectionId?: string | null;
}

export class ListAssignmentsQueryDto {
  @ApiPropertyOptional()
  assessmentId?: string;

  @ApiPropertyOptional()
  studentId?: string;

  @ApiPropertyOptional()
  classId?: string;

  @ApiPropertyOptional({ enum: ["assigned", "started", "submitted", "overdue", "exempted", "cancelled"] })
  status?: string;

  @ApiPropertyOptional({ example: 1 })
  page?: string;

  @ApiPropertyOptional({ example: 25 })
  pageSize?: string;
}

export class CreateAssignmentDto {
  @ApiProperty()
  assessmentId!: string;

  @ApiPropertyOptional()
  studentId?: string | null;

  @ApiPropertyOptional()
  classId?: string | null;

  @ApiPropertyOptional()
  lessonId?: string | null;

  @ApiPropertyOptional({ example: "2026-06-10T09:00:00.000Z" })
  opensAt?: string | null;

  @ApiPropertyOptional({ example: "2026-06-17T23:59:00.000Z" })
  dueAt?: string | null;

  @ApiPropertyOptional({ enum: ["assigned", "started", "submitted", "overdue", "exempted", "cancelled"] })
  status?: string;
}

export class UpdateAssignmentDto {
  @ApiPropertyOptional()
  opensAt?: string | null;

  @ApiPropertyOptional()
  dueAt?: string | null;

  @ApiPropertyOptional({ enum: ["assigned", "started", "submitted", "overdue", "exempted", "cancelled"] })
  status?: string;
}

export class ListAttemptsQueryDto {
  @ApiPropertyOptional()
  assessmentAssignmentId?: string;

  @ApiPropertyOptional()
  studentId?: string;

  @ApiPropertyOptional({ enum: ["in_progress", "submitted", "marked", "needs_review"] })
  resultStatus?: string;

  @ApiPropertyOptional({ example: 1 })
  page?: string;

  @ApiPropertyOptional({ example: 25 })
  pageSize?: string;
}

export class CreateAttemptDto {
  @ApiProperty()
  assessmentAssignmentId!: string;

  @ApiPropertyOptional()
  studentId?: string;

  @ApiPropertyOptional()
  rawImportPayload?: unknown;
}

export class UpdateAttemptDto {
  @ApiPropertyOptional()
  timeSpentSeconds?: number | null;

  @ApiPropertyOptional()
  rawScore?: number | null;

  @ApiPropertyOptional()
  maxScore?: number | null;

  @ApiPropertyOptional()
  percentageScore?: number | null;

  @ApiPropertyOptional({ enum: ["in_progress", "submitted", "marked", "needs_review"] })
  resultStatus?: string;

  @ApiPropertyOptional()
  teacherComment?: string | null;

  @ApiPropertyOptional()
  parentComment?: string | null;

  @ApiPropertyOptional()
  rawImportPayload?: unknown;
}

export class MarkAttemptDto {
  @ApiPropertyOptional({ enum: ["auto", "manual"] })
  mode?: string;

  @ApiPropertyOptional()
  teacherComment?: string | null;

  @ApiPropertyOptional()
  parentComment?: string | null;
}

export class ListResponsesQueryDto {
  @ApiPropertyOptional()
  assessmentAttemptId?: string;

  @ApiPropertyOptional()
  questionId?: string;

  @ApiPropertyOptional({ example: 1 })
  page?: string;

  @ApiPropertyOptional({ example: 25 })
  pageSize?: string;
}

export class SaveStudentResponseDto {
  @ApiProperty()
  assessmentAttemptId!: string;

  @ApiProperty()
  questionId!: string;

  @ApiPropertyOptional()
  selectedOptionId?: string | null;

  @ApiPropertyOptional()
  responseText?: string | null;

  @ApiPropertyOptional()
  timeSpentSeconds?: number | null;
}

export class UpdateStudentResponseDto {
  @ApiPropertyOptional()
  selectedOptionId?: string | null;

  @ApiPropertyOptional()
  responseText?: string | null;

  @ApiPropertyOptional()
  timeSpentSeconds?: number | null;

  @ApiPropertyOptional()
  feedback?: string | null;
}

export class MarkStudentResponseDto {
  @ApiPropertyOptional()
  isCorrect?: boolean | null;

  @ApiPropertyOptional()
  marksAwarded?: number | null;

  @ApiPropertyOptional()
  feedback?: string | null;
}
