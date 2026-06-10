import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module.js";
import { PrismaModule } from "../prisma/prisma.module.js";
import { RbacModule } from "../rbac/rbac.module.js";
import { AssessmentSetupController } from "./assessment-setup.controller.js";
import { AssessmentSetupService } from "./assessment-setup.service.js";
import { AssignmentsController } from "./assignments.controller.js";
import { AssignmentsService } from "./assignments.service.js";
import { AttemptsController } from "./attempts.controller.js";
import { AttemptsService } from "./attempts.service.js";
import { QuestionsController } from "./questions.controller.js";
import { QuestionsService } from "./questions.service.js";
import { StudentResponsesController } from "./student-responses.controller.js";
import { StudentResponsesService } from "./student-responses.service.js";
import { SubjectsController } from "./subjects.controller.js";
import { SubjectsService } from "./subjects.service.js";

@Module({
  imports: [PrismaModule, AuthModule, RbacModule],
  controllers: [
    AssessmentSetupController,
    SubjectsController,
    QuestionsController,
    AssignmentsController,
    AttemptsController,
    StudentResponsesController
  ],
  providers: [
    AssessmentSetupService,
    SubjectsService,
    QuestionsService,
    AssignmentsService,
    AttemptsService,
    StudentResponsesService
  ],
  exports: [
    AssessmentSetupService,
    SubjectsService,
    QuestionsService,
    AssignmentsService,
    AttemptsService,
    StudentResponsesService
  ]
})
export class AssessmentsModule {}
