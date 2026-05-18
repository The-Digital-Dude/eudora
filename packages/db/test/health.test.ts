import { describe, expect, it, vi } from "vitest";
import { getDatabaseStatus } from "../src/health";

describe("getDatabaseStatus", () => {
  it("reports an up database with measured latency", async () => {
    const query = vi.fn().mockResolvedValue([{ value: 1 }]);

    const result = await getDatabaseStatus({ $queryRaw: query }, () => 10, () => 25);

    expect(query).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      status: "up",
      latencyMs: 15
    });
  });

  it("reports a down database when the probe fails", async () => {
    const query = vi.fn().mockRejectedValue(new Error("connection refused"));

    const result = await getDatabaseStatus({ $queryRaw: query }, () => 5, () => 9);

    expect(result).toEqual({
      status: "down",
      latencyMs: null
    });
  });
});
