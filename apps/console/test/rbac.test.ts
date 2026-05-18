import { describe, expect, it } from "vitest";
import { PERMISSIONS } from "@guidora/contracts";
import { filterNavGroupsByPermissions, hasPermission } from "../src/lib/rbac";

describe("console RBAC helpers", () => {
  it("checks permissions for the active session", () => {
    expect(hasPermission([PERMISSIONS.USERS_READ], PERMISSIONS.USERS_READ)).toBe(true);
    expect(hasPermission([PERMISSIONS.DASHBOARD_READ], PERMISSIONS.USERS_READ)).toBe(false);
  });

  it("filters navigation groups by required permissions", () => {
    const groups = [
      {
        label: "Apps",
        items: [
          { title: "Dashboard", url: "/dashboard", requiredPermission: PERMISSIONS.DASHBOARD_READ },
          { title: "Users", url: "/users", requiredPermission: PERMISSIONS.USERS_READ }
        ]
      }
    ];

    expect(filterNavGroupsByPermissions(groups, [PERMISSIONS.DASHBOARD_READ])).toEqual([
      {
        label: "Apps",
        items: [{ title: "Dashboard", url: "/dashboard", requiredPermission: PERMISSIONS.DASHBOARD_READ }]
      }
    ]);
  });
});
