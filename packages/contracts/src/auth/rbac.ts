import { z } from "zod";

export const userRoleSchema = z.enum(["OWNER", "ADMIN", "MEMBER"]);
export const userStatusSchema = z.enum(["ACTIVE", "INVITED", "DISABLED"]);

export type UserRole = z.infer<typeof userRoleSchema>;
export type UserStatus = z.infer<typeof userStatusSchema>;

export const PERMISSIONS = {
  DASHBOARD_READ: "dashboard:read",
  USERS_READ: "users:read",
  USERS_CREATE: "users:create",
  USERS_UPDATE: "users:update",
  USERS_DISABLE: "users:disable",
  USERS_RESET_PASSWORD: "users:reset-password",
  USERS_MANAGE_OWNER: "users:manage-owner",
  SETTINGS_READ: "settings:read",
  SETTINGS_UPDATE_OWN: "settings:update-own"
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const permissionSchema = z.enum([
  PERMISSIONS.DASHBOARD_READ,
  PERMISSIONS.USERS_READ,
  PERMISSIONS.USERS_CREATE,
  PERMISSIONS.USERS_UPDATE,
  PERMISSIONS.USERS_DISABLE,
  PERMISSIONS.USERS_RESET_PASSWORD,
  PERMISSIONS.USERS_MANAGE_OWNER,
  PERMISSIONS.SETTINGS_READ,
  PERMISSIONS.SETTINGS_UPDATE_OWN
]);

export const ROLE_PERMISSIONS = {
  OWNER: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DISABLE,
    PERMISSIONS.USERS_RESET_PASSWORD,
    PERMISSIONS.USERS_MANAGE_OWNER,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE_OWN
  ],
  ADMIN: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DISABLE,
    PERMISSIONS.USERS_RESET_PASSWORD,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE_OWN
  ],
  MEMBER: [
    PERMISSIONS.DASHBOARD_READ,
    PERMISSIONS.SETTINGS_READ,
    PERMISSIONS.SETTINGS_UPDATE_OWN
  ]
} as const satisfies Record<UserRole, readonly Permission[]>;

export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return (ROLE_PERMISSIONS[role] as readonly Permission[]).includes(permission);
}
