import { describe, expect, it } from "vitest"
import { PERMISSIONS, type AuthSession, type UserListItem } from "@guidora/contracts"

import {
  buildCreateUserRequest,
  buildUpdateUserRequest,
  computeUserStats,
  getAssignableRoles,
  toUserTableRow,
} from "../src/app/(dashboard)/users/user-management"

const owner: AuthSession["user"] = {
  id: "user-owner",
  email: "owner@guidora.test",
  name: "Owner User",
  status: "ACTIVE",
  permissions: [
    PERMISSIONS.USERS_READ,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_UPDATE,
    PERMISSIONS.USERS_DISABLE,
    PERMISSIONS.USERS_RESET_PASSWORD,
    PERMISSIONS.USERS_MANAGE_OWNER,
  ],
  role: {
    id: "role-owner",
    key: "OWNER",
    name: "Owner",
  },
}

const member: UserListItem = {
  id: "user-member",
  email: "member@guidora.test",
  name: "Member User",
  status: "ACTIVE",
  permissions: [PERMISSIONS.DASHBOARD_READ],
  role: {
    id: "role-member",
    key: "MEMBER",
    name: "Member",
  },
  joinedDate: "2026-05-17",
  lastLoginAt: null,
}

describe("console user management helpers", () => {
  it("maps API users into table rows", () => {
    expect(toUserTableRow(member)).toEqual({
      id: "user-member",
      name: "Member User",
      email: "member@guidora.test",
      avatar: "MU",
      role: "MEMBER",
      status: "ACTIVE",
      joinedDate: "2026-05-17",
      lastLogin: "Never",
    })
  })

  it("allows owners to assign non-owner roles", () => {
    expect(getAssignableRoles(owner)).toEqual([
      { key: "ADMIN", label: "Admin" },
      { key: "MEMBER", label: "Member" },
    ])
  })

  it("builds create and update payloads for the API contracts", () => {
    expect(
      buildCreateUserRequest({
        name: "New Admin",
        email: "New.Admin@Guidora.test",
        roleKey: "ADMIN",
        password: "password123",
        status: "ACTIVE",
      })
    ).toEqual({
      name: "New Admin",
      email: "New.Admin@Guidora.test",
      roleKey: "ADMIN",
      password: "password123",
    })

    expect(
      buildUpdateUserRequest({
        name: "Updated Member",
        email: "member@guidora.test",
        roleKey: "MEMBER",
        password: "",
        status: "DISABLED",
      })
    ).toEqual({
      name: "Updated Member",
      roleKey: "MEMBER",
      status: "DISABLED",
    })
  })

  it("computes user management stats from live user data", () => {
    expect(
      computeUserStats([
        member,
        { ...member, id: "admin-1", role: { id: "role-admin", key: "ADMIN", name: "Admin" } },
        { ...member, id: "disabled-1", status: "DISABLED" },
      ])
    ).toEqual({
      total: 3,
      active: 2,
      admins: 1,
      disabled: 1,
    })
  })
})
