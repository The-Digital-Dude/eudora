import { type INestApplication, type LoggerService, type LogLevel } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";

import { AppModule } from "./app.module.js";
import { setupOpenApi } from "./openapi.js";

type CreateAppOptions = {
  logger?: false | LoggerService | LogLevel[];
  openApi?: boolean;
};

export async function createApp(options: CreateAppOptions = {}): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule, {
    logger: options.logger ?? ["log", "error", "warn"]
  });

  app.enableCors({
    origin: resolveCorsOrigins(),
    credentials: true
  });

  if (options.openApi ?? true) {
    setupOpenApi(app);
  }

  return app;
}

function resolveCorsOrigins(): string[] {
  const configuredOrigins = process.env.CORS_ORIGIN?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configuredOrigins?.includes("*")) {
    throw new Error("CORS_ORIGIN cannot be '*' when credentialed cookie auth is enabled");
  }

  return configuredOrigins && configuredOrigins.length > 0
    ? configuredOrigins
    : ["http://localhost:3000", "http://localhost:3002"];
}
