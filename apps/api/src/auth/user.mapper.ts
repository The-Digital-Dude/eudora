import { CurrentUser, UserListItem } from "@guidora/contracts";

type RolePermissionRecord = {
  permission: {
    key: string;
  };
};

export type UserWithRole = {
  id: string;
  email: string;
  name: string;
  status: string;
  lastLoginAt?: Date | null;
  createdAt: Date;
  role: {
    id: string;
    key: string;
    name: string;
    permissions: RolePermissionRecord[];
  };
};

export const userWithRoleInclude = {
  role: {
    include: {
      permissions: {
        include: {
          permission: true
        }
      }
    }
  }
} as const;

export function toCurrentUser(user: UserWithRole): CurrentUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status as CurrentUser["status"],
    role: {
      id: user.role.id,
      key: user.role.key as CurrentUser["role"]["key"],
      name: user.role.name
    },
    permissions: user.role.permissions.map((rolePermission) => rolePermission.permission.key) as CurrentUser["permissions"]
  };
}

export function toUserListItem(user: UserWithRole): UserListItem {
  return {
    ...toCurrentUser(user),
    joinedDate: user.createdAt.toISOString().slice(0, 10),
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null
  };
}
