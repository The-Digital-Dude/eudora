import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { config as loadEnv } from "dotenv";

const apiRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspaceRoot = path.resolve(apiRoot, "../..");

export function loadApiEnv(): void {
  loadEnvFile(path.resolve(apiRoot, ".env"));
  loadEnvFile(path.resolve(workspaceRoot, ".env"));
}

function loadEnvFile(envPath: string): void {
  if (!existsSync(envPath)) {
    return;
  }

  loadEnv({ path: envPath, quiet: true });
}

loadApiEnv();
