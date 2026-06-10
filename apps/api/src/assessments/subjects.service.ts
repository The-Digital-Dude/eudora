import { ConflictException, Inject, Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service.js";
import {
  CreateLookupDto,
  LookupQueryDto,
  UpdateLookupDto
} from "./assessments.dto.js";
import {
  AssessmentDomainService,
  type PrismaAccess,
  enumFilter,
  enumValue,
  lookupSelect,
  normalizeCode,
  normalizePagination,
  requireText,
  searchFilter,
  toPage
} from "./assessments.common.js";

@Injectable()
export class SubjectsService extends AssessmentDomainService {
  constructor(@Inject(PrismaService) prisma: PrismaAccess) {
    super(prisma);
  }

  async listSubjects(query: LookupQueryDto = {}) {
    const pagination = normalizePagination(query);
    const where = {
      ...searchFilter(query.search, ["code", "name"]),
      ...enumFilter("status", query.status, ["active", "inactive", "archived"])
    };
    const [items, total] = await Promise.all([
      this.prisma.db.subject.findMany({
        where,
        orderBy: { code: "asc" },
        skip: pagination.skip,
        take: pagination.pageSize,
        select: lookupSelect
      }),
      this.prisma.db.subject.count({ where })
    ]);

    return toPage(items, total, pagination);
  }

  async createSubject(input: CreateLookupDto, actorUserId: string) {
    const code = normalizeCode(input.code);
    await this.assertSubjectCodeAvailable(code);
    const record = await this.prisma.db.subject.create({
      data: { code, name: requireText(input.name, "name") },
      select: lookupSelect
    });
    await this.audit(actorUserId, "assessments.subject.created", "subject", record.id);
    return record;
  }

  async updateSubject(id: string, input: UpdateLookupDto, actorUserId: string) {
    const record = await this.prisma.db.subject.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: requireText(input.name, "name") } : {}),
        ...(input.status !== undefined ? { status: enumValue(input.status, ["active", "inactive", "archived"], "status") } : {})
      } as never,
      select: lookupSelect
    });
    await this.audit(actorUserId, "assessments.subject.updated", "subject", record.id);
    return record;
  }

  private async assertSubjectCodeAvailable(code: string): Promise<void> {
    const existing = await this.prisma.db.subject.findUnique({ where: { code }, select: { id: true } });
    if (existing) {
      throw new ConflictException("Subject code already exists");
    }
  }
}
