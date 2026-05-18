import { z } from "zod";
import { permissionSchema, userRoleSchema, userStatusSchema } from "./rbac";

export const roleSummarySchema = z.object({
  id: z.string().min(1),
  key: userRoleSchema,
  name: z.string().min(1)
});

export const currentUserSchema = z.object({
  id: z.string().min(1),
  email: z.string().email(),
  name: z.string().min(1),
  role: roleSummarySchema,
  status: userStatusSchema,
  permissions: z.array(permissionSchema)
});

export const loginRequestSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  password: z.string().min(8)
});

export const authSessionSchema = z.object({
  user: currentUserSchema
});

export const createUserRequestSchema = z.object({
  email: z.string().email().transform((value) => value.toLowerCase()),
  name: z.string().min(1),
  roleKey: userRoleSchema.exclude(["OWNER"]),
  password: z.string().min(8)
});

export const updateUserRequestSchema = z.object({
  name: z.string().min(1).optional(),
  roleKey: userRoleSchema.exclude(["OWNER"]).optional(),
  status: userStatusSchema.exclude(["INVITED"]).optional()
});

export const userListItemSchema = currentUserSchema.extend({
  joinedDate: z.string().min(1),
  lastLoginAt: z.string().datetime().nullable().optional()
});

export const userListResponseSchema = z.object({
  items: z.array(userListItemSchema)
});

export const resetPasswordResponseSchema = z.object({
  temporaryPassword: z.string().min(8)
});

export type RoleSummary = z.infer<typeof roleSummarySchema>;
export type CurrentUser = z.infer<typeof currentUserSchema>;
export type LoginRequest = z.infer<typeof loginRequestSchema>;
export type AuthSession = z.infer<typeof authSessionSchema>;
export type CreateUserRequest = z.infer<typeof createUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof updateUserRequestSchema>;
export type UserListItem = z.infer<typeof userListItemSchema>;
export type UserListResponse = z.infer<typeof userListResponseSchema>;
export type ResetPasswordResponse = z.infer<typeof resetPasswordResponseSchema>;
