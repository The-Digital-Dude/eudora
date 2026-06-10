import { describe, expect, it, vi } from "vitest";

import { seedAssessmentsDemo } from "./seed-assessments-demo.js";

describe("seed assessments demo", () => {
  it("refuses to seed assessment demo records without a superadmin actor", async () => {
    const prisma = {
      user: {
        findFirst: vi.fn().mockResolvedValue(null)
      }
    };

    await expect(seedAssessmentsDemo(prisma as never)).rejects.toThrow(
      "Cannot seed assessment demo before a superadmin user exists"
    );
  });
});
