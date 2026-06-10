import { BadRequestException, Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service.js";
import {
  CreateAssignmentDto,
  ListAssignmentsQueryDto,
  UpdateAssignmentDto
} from "./assessments.dto.js";
import {
  AssessmentDomainService,
  type PrismaAccess,
  assignmentSelect,
  emptyToNull,
  enumFilter,
  enumValue,
  idFilter,
  normalizePagination,
  parseOptionalDate,
  requireRecord,
  requireText,
  toPage
} from "./assessments.common.js";

@Injectable()
export class AssignmentsService extends AssessmentDomainService {
  constructor(@Inject(PrismaService) prisma: PrismaAccess) {
    super(prisma);
  }

  async listAssignments(query: ListAssignmentsQueryDto = {}) {
    const pagination = normalizePagination(query);
    const where = {
      ...idFilter("assessmentId", query.assessmentId),
      ...idFilter("studentId", query.studentId),
      ...idFilter("classId", query.classId),
      ...enumFilter("status", query.status, ["assigned", "started", "submitted", "overdue", "exempted", "cancelled"])
    };
    const [items, total] = await Promise.all([
      this.prisma.db.assessmentAssignment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: pagination.skip,
        take: pagination.pageSize,
        select: assignmentSelect
      }),
      this.prisma.db.assessmentAssignment.count({ where })
    ]);

    return toPage(items, total, pagination);
  }

  async getAssignment(id: string) {
    const assignment = await this.prisma.db.assessmentAssignment.findUnique({ where: { id }, select: assignmentSelect });
    return requireRecord(assignment, "Assignment not found");
  }

  async createAssignment(input: CreateAssignmentDto, actorUserId: string) {
    const studentId = emptyToNull(input.studentId);
    const classId = emptyToNull(input.classId);
    if ((studentId ? 1 : 0) + (classId ? 1 : 0) !== 1) {
      throw new BadRequestException("Exactly one of studentId or classId is required");
    }
    const assignment = await this.prisma.db.assessmentAssignment.create({
      data: {
        assessmentId: requireText(input.assessmentId, "assessmentId"),
        studentId,
        classId,
        lessonId: emptyToNull(input.lessonId),
        assignedByUserId: actorUserId,
        opensAt: parseOptionalDate(input.opensAt, "opensAt"),
        dueAt: parseOptionalDate(input.dueAt, "dueAt"),
        status: enumValue(input.status ?? "assigned", ["assigned", "started", "submitted", "overdue", "exempted", "cancelled"], "status")
      },
      select: assignmentSelect
    });
    await this.audit(actorUserId, "assessments.assignment.created", "assessmentAssignment", assignment.id);
    return assignment;
  }

  async updateAssignment(id: string, input: UpdateAssignmentDto, actorUserId: string) {
    const assignment = await this.prisma.db.assessmentAssignment.update({
      where: { id },
      data: {
        ...(input.opensAt !== undefined ? { opensAt: parseOptionalDate(input.opensAt, "opensAt") } : {}),
        ...(input.dueAt !== undefined ? { dueAt: parseOptionalDate(input.dueAt, "dueAt") } : {}),
        ...(input.status !== undefined
          ? { status: enumValue(input.status, ["assigned", "started", "submitted", "overdue", "exempted", "cancelled"], "status") }
          : {})
      } as never,
      select: assignmentSelect
    });
    await this.audit(actorUserId, "assessments.assignment.updated", "assessmentAssignment", assignment.id);
    return assignment;
  }

  async cancelAssignment(id: string, actorUserId: string) {
    const assignment = await this.prisma.db.assessmentAssignment.update({
      where: { id },
      data: { status: "cancelled" },
      select: assignmentSelect
    });
    await this.audit(actorUserId, "assessments.assignment.cancelled", "assessmentAssignment", assignment.id);
    return assignment;
  }

  async remindAssignment(id: string, actorUserId: string) {
    const assignment = await this.prisma.db.assessmentAssignment.update({
      where: { id },
      data: { reminderCount: { increment: 1 } },
      select: assignmentSelect
    });
    await this.audit(actorUserId, "assessments.assignment.reminded", "assessmentAssignment", assignment.id);
    return assignment;
  }
}
