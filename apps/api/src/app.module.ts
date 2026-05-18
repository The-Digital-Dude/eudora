import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "@guidora/db";
import { resolve } from "node:path";
import { CommonModule } from "./common/common.module";
import { validateEnv } from "./env";
import { AuthModule } from "./auth/auth.module";
import { HealthModule } from "./health/health.module";
import { UsersModule } from "./users/users.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [resolve(__dirname, "../.env"), resolve(__dirname, "../../..", ".env")],
      validate: validateEnv
    }),
    CommonModule,
    DatabaseModule,
    AuthModule,
    HealthModule,
    UsersModule
  ]
})
export class AppModule {}
