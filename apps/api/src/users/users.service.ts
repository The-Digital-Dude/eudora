import { ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import {
  CreateUserRequest,
  CurrentUser,
  ResetPasswordResponse,
  UpdateUserRequest,
  UserListResponse
} from "@guidora/contracts";
import { PrismaService } from "@guidora/db";
import { randomBytes } from "node:crypto";
import { hashPassword } from "../auth/password";
import { toCurrentUser, toUserListItem, userWithRoleInclude } from "../auth/user.mapper";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(): Promise<UserListResponse> {
    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      include: userWithRoleInclude
    });

    return { items: users.map(toUserListItem) };
  }

  async create(input: CreateUserRequest): Promise<CurrentUser> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: input.email }
    });

    if (existingUser) {
      throw new ConflictException("A user with this email already exists");
    }

    const role = await this.prisma.role.findUniqueOrThrow({
      where: { key: input.roleKey }
    });

    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash: hashPassword(input.password),
        status: "ACTIVE",
        roleId: role.id
      },
      include: userWithRoleInclude
    });

    return toCurrentUser(user);
  }

  async update(id: string, input: UpdateUserRequest, actor: CurrentUser): Promise<CurrentUser> {
    const target = await this.findUserOrThrow(id);

    this.assertCanManageTarget(actor, toCurrentUser(target));

    const role = input.roleKey
      ? await this.prisma.role.findUniqueOrThrow({ where: { key: input.roleKey } })
      : null;

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        name: input.name,
        status: input.status,
        roleId: role?.id
      },
      include: userWithRoleInclude
    });

    return toCurrentUser(user);
  }

  async resetPassword(id: string, actor: CurrentUser): Promise<ResetPasswordResponse> {
    const target = await this.findUserOrThrow(id);

    this.assertCanManageTarget(actor, toCurrentUser(target));

    const temporaryPassword = randomBytes(9).toString("base64url");
    await this.prisma.user.update({
      where: { id },
      data: { passwordHash: hashPassword(temporaryPassword) }
    });

    return { temporaryPassword };
  }

  async disable(id: string, actor: CurrentUser): Promise<CurrentUser> {
    const target = await this.findUserOrThrow(id);

    this.assertCanManageTarget(actor, toCurrentUser(target));

    if (actor.id === id) {
      throw new ForbiddenException("You cannot disable your own account");
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: { status: "DISABLED" },
      include: userWithRoleInclude
    });

    await this.prisma.refreshToken.updateMany({
      where: { userId: id, revokedAt: null },
      data: { revokedAt: new Date() }
    });

    return toCurrentUser(user);
  }

  private async findUserOrThrow(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: userWithRoleInclude
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return user;
  }

  private assertCanManageTarget(actor: CurrentUser, target: CurrentUser): void {
    if (target.role.key === "OWNER" && !actor.permissions.includes("users:manage-owner")) {
      throw new ForbiddenException("Only owners can manage owner users");
    }
  }
}
