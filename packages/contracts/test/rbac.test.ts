import { describe, expect, it } from "vitest";
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  currentUserSchema,
  loginRequestSchema,
  userListItemSchema,
  userRoleSchema,
  userStatusSchema
} from "../src";

describe("RBAC contracts", () => {
  it("defines the v1 system roles and statuses", () => {
    expect(userRoleSchema.options).toEqual(["OWNER", "ADMIN", "MEMBER"]);
    expect(userStatusSchema.options).toEqual(["ACTIVE", "INVITED", "DISABLED"]);
  });

  it("maps roles to permissions", () => {
    expect(ROLE_PERMISSIONS.OWNER).toContain(PERMISSIONS.USERS_DISABLE);
    expect(ROLE_PERMISSIONS.ADMIN).toContain(PERMISSIONS.USERS_CREATE);
    expect(ROLE_PERMISSIONS.ADMIN).not.toContain(PERMISSIONS.USERS_MANAGE_OWNER);
    expect(ROLE_PERMISSIONS.MEMBER).toEqual([
      PERMISSIONS.DASHBOARD_READ,
      PERMISSIONS.SETTINGS_READ,
      PERMISSIONS.SETTINGS_UPDATE_OWN
    ]);
  });

  it("validates auth and user payloads shared by API and console", () => {
    expect(
      loginRequestSchema.parse({
        email: "owner@guidora.local",
        password: "password123"
      })
    ).toEqual({
      email: "owner@guidora.local",
      password: "password123"
    });

    const currentUser = {
      id: "usr_1",
      email: "owner@guidora.local",
      name: "Guidora Owner",
      role: {
        id: "role_owner",
        key: "OWNER",
        name: "Owner"
      },
      status: "ACTIVE",
      permissions: ROLE_PERMISSIONS.OWNER
    };

    expect(currentUserSchema.parse(currentUser)).toEqual(currentUser);
    expect(userListItemSchema.parse({ ...currentUser, joinedDate: "2026-05-16" })).toEqual({
      ...currentUser,
      joinedDate: "2026-05-16"
    });
  });
});
