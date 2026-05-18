import { Injectable } from "@nestjs/common";
import { HealthResponse } from "@guidora/contracts";
import { getDatabaseStatus, PrismaService } from "@guidora/db";

@Injectable()
export class HealthService {
  constructor(private readonly prismaService: PrismaService) {}

  async getHealth(): Promise<HealthResponse> {
    const database = await getDatabaseStatus(this.prismaService);

    return {
      status: database.status === "up" ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      database,
      service: {
        name: "guidora-api",
        version: process.env.npm_package_version ?? "0.0.0"
      }
    };
  }
}
