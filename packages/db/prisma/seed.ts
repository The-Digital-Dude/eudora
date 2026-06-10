import path from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadEnv } from "dotenv";

import { createPrismaClient } from "../src/client.js";
import { seedAssessmentsDemo } from "./seed-assessments-demo.js";
import { seedEducationDemo, type SeedEducationDemoPrisma } from "./seed-education-demo.js";
import { seedSuperadmin } from "./seed-superadmin.js";

loadEnv({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../.env")
});

const prisma = createPrismaClient();

const systemPermissions = [
  "users.read",
  "users.create",
  "users.activate",
  "users.reject",
  "users.assignRoles",
  "roles.read",
  "roles.create",
  "roles.update",
  "roles.assignPermissions",
  "audit.read",
  "education.read",
  "education.manageStructure",
  "families.read",
  "families.create",
  "families.update",
  "students.read",
  "students.create",
  "students.update",
  "guardians.read",
  "guardians.create",
  "guardians.update",
  "enrollments.read",
  "enrollments.manage",
  "assessments.read",
  "assessments.manage",
  "assessments.assign",
  "assessments.attempt",
  "assessments.mark",
  "familyPortal.read",
  "familyPortal.updateContact"
];

const healthCheckCount = await prisma.healthCheck.count();

if (healthCheckCount === 0) {
  await prisma.healthCheck.create({
    data: {}
  });
}

const permissions = await Promise.all(
  systemPermissions.map((key) =>
    prisma.permission.upsert({
      where: { key },
      update: { isSystem: true },
      create: {
        key,
        isSystem: true
      }
    })
  )
);

const superadminRole = await prisma.role.upsert({
  where: { key: "superadmin" },
  update: {
    name: "Superadmin",
    isSystem: true
  },
  create: {
    key: "superadmin",
    name: "Superadmin",
    description: "Full platform administration access.",
    isSystem: true
  }
});

const guardianRole = await prisma.role.upsert({
  where: { key: "guardian" },
  update: {
    name: "Guardian",
    description: "Default guardian portal access.",
    isSystem: true
  },
  create: {
    key: "guardian",
    name: "Guardian",
    description: "Default guardian portal access.",
    isSystem: true
  }
});

await prisma.rolePermission.createMany({
  data: permissions.map((permission) => ({
    roleId: superadminRole.id,
    permissionId: permission.id
  })),
  skipDuplicates: true
});

const familyPortalPermissions = permissions.filter((permission) =>
  ["familyPortal.read", "familyPortal.updateContact"].includes(permission.key)
);

if (familyPortalPermissions.length > 0) {
  await prisma.rolePermission.createMany({
    data: familyPortalPermissions.map((permission) => ({
      roleId: guardianRole.id,
      permissionId: permission.id
    })),
    skipDuplicates: true
  });
}

await seedSuperadmin(prisma);
await seedEducationDemo(prisma as unknown as SeedEducationDemoPrisma);
await seedAssessmentsDemo(prisma);

await prisma.$disconnect();
