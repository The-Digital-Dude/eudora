import { scryptSync, randomBytes, timingSafeEqual } from "node:crypto";
import { PERMISSIONS, ROLE_PERMISSIONS, UserRole } from "@guidora/contracts";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { PrismaClient } from "../src/generated/prisma/client";

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

function assertPasswordHashWorks(password: string, passwordHash: string): void {
  const [, salt, expectedHash] = passwordHash.split(":");
  const actualHash = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, "hex");

  if (actualHash.length !== expected.length || !timingSafeEqual(actualHash, expected)) {
    throw new Error("Generated seed password hash failed verification");
  }
}

const permissionLabels: Record<string, { label: string; category: string }> = {
  [PERMISSIONS.DASHBOARD_READ]: { label: "View dashboard", category: "Dashboard" },
  [PERMISSIONS.USERS_READ]: { label: "View users", category: "Users" },
  [PERMISSIONS.USERS_CREATE]: { label: "Create users", category: "Users" },
  [PERMISSIONS.USERS_UPDATE]: { label: "Update users", category: "Users" },
  [PERMISSIONS.USERS_DISABLE]: { label: "Disable users", category: "Users" },
  [PERMISSIONS.USERS_RESET_PASSWORD]: { label: "Reset user passwords", category: "Users" },
  [PERMISSIONS.USERS_MANAGE_OWNER]: { label: "Manage owner users", category: "Users" },
  [PERMISSIONS.SETTINGS_READ]: { label: "View settings", category: "Settings" },
  [PERMISSIONS.SETTINGS_UPDATE_OWN]: { label: "Update own settings", category: "Settings" }
};

const roleNames: Record<UserRole, string> = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member"
};

async function main(): Promise<void> {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

  await prisma.healthCheck.create({ data: {} });

  for (const [key, config] of Object.entries(permissionLabels)) {
    await prisma.permission.upsert({
      where: { key },
      create: {
        key,
        label: config.label,
        category: config.category
      },
      update: {
        label: config.label,
        category: config.category
      }
    });
  }

  for (const roleKey of Object.keys(ROLE_PERMISSIONS) as UserRole[]) {
    const role = await prisma.role.upsert({
      where: { key: roleKey },
      create: {
        key: roleKey,
        name: roleNames[roleKey],
        isSystem: true
      },
      update: {
        name: roleNames[roleKey],
        isSystem: true
      }
    });

    await prisma.rolePermission.deleteMany({
      where: { roleId: role.id }
    });

    await prisma.rolePermission.createMany({
      data: ROLE_PERMISSIONS[roleKey].map((permissionKey) => ({
        roleId: role.id,
        permissionKey
      })),
      skipDuplicates: true
    });
  }

  const ownerEmail = process.env.SEED_OWNER_EMAIL ?? "owner@guidora.local";
  const ownerPassword = process.env.SEED_OWNER_PASSWORD ?? "password123";
  const ownerName = process.env.SEED_OWNER_NAME ?? "Guidora Owner";
  const ownerRole = await prisma.role.findUniqueOrThrow({ where: { key: "OWNER" } });
  const passwordHash = hashPassword(ownerPassword);
  assertPasswordHashWorks(ownerPassword, passwordHash);

  await prisma.user.upsert({
    where: { email: ownerEmail.toLowerCase() },
    create: {
      email: ownerEmail.toLowerCase(),
      name: ownerName,
      passwordHash,
      status: "ACTIVE",
      roleId: ownerRole.id
    },
    update: {
      name: ownerName,
      status: "ACTIVE",
      roleId: ownerRole.id
    }
  });

  await prisma.$disconnect();
  await pool.end();
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
