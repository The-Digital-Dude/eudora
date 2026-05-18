export type DatabaseStatus = {
  status: "up" | "down";
  latencyMs: number | null;
};

export type QueryableDatabase = {
  $queryRaw<T = unknown>(
    query: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T>;
};

type Clock = () => number;

export async function getDatabaseStatus(
  database: QueryableDatabase,
  startClock: Clock = Date.now,
  endClock: Clock = Date.now
): Promise<DatabaseStatus> {
  const startedAt = startClock();

  try {
    await database.$queryRaw`SELECT 1`;

    return {
      status: "up",
      latencyMs: Math.max(0, Math.round(endClock() - startedAt))
    };
  } catch {
    return {
      status: "down",
      latencyMs: null
    };
  }
}
