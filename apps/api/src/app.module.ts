import { Module } from "@nestjs/common";
import { AcademicModule } from "./modules/academic/academic.module";
import { AssignmentsModule } from "./modules/assignments/assignments.module";
import { AttendanceModule } from "./modules/attendance/attendance.module";
import { AuditModule } from "./modules/audit/audit.module";
import { BillingModule } from "./modules/billing/billing.module";
import { ClassesModule } from "./modules/classes/classes.module";
import { CommunicationModule } from "./modules/communication/communication.module";
import { CrmModule } from "./modules/crm/crm.module";
import { EnrolmentModule } from "./modules/enrolment/enrolment.module";
import { IdentityModule } from "./modules/identity/identity.module";
import { ImportsModule } from "./modules/imports/imports.module";
import { MakeupsModule } from "./modules/makeups/makeups.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { ReportingModule } from "./modules/reporting/reporting.module";
import { HealthModule } from "./health/health.module";

@Module({
  imports: [
    HealthModule,
    IdentityModule,
    AcademicModule,
    AssignmentsModule,
    AuditModule,
    AttendanceModule,
    BillingModule,
    ClassesModule,
    CommunicationModule,
    CrmModule,
    EnrolmentModule,
    ImportsModule,
    MakeupsModule,
    PaymentsModule,
    ReportingModule
  ]
})
export class AppModule {}
