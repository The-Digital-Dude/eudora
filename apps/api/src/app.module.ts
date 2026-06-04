import "./env.js";
import "reflect-metadata";

import { Module } from "@nestjs/common";
import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";

import { AuthModule } from "./auth/auth.module.js";
import { ApiExceptionFilter } from "./common/http/api-exception.filter.js";
import { ApiEnvelopeInterceptor } from "./common/http/api-envelope.interceptor.js";
import { EducationStructureModule } from "./education-structure/education-structure.module.js";
import { EnrollmentsModule } from "./enrollments/enrollments.module.js";
import { FamiliesModule } from "./families/families.module.js";
import { FamilyPortalModule } from "./family-portal/family-portal.module.js";
import { HealthModule } from "./health/health.module.js";
import { PrismaModule } from "./prisma/prisma.module.js";
import { RbacModule } from "./rbac/rbac.module.js";
import { UsersModule } from "./users/users.module.js";

@Module({
  imports: [
    PrismaModule,
    RbacModule,
    AuthModule,
    UsersModule,
    EducationStructureModule,
    EnrollmentsModule,
    FamiliesModule,
    FamilyPortalModule,
    HealthModule
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: ApiEnvelopeInterceptor },
    { provide: APP_FILTER, useClass: ApiExceptionFilter }
  ]
})
export class AppModule {}
