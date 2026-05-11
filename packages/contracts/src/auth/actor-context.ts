export type ActorRole =
  | "owner"
  | "admin"
  | "academic_lead"
  | "teacher"
  | "tutor"
  | "billing_admin"
  | "parent"
  | "student"
  | "developer";

export type ActorContext = {
  userId: string;
  providerUserId: string;
  roles: ActorRole[];
  centreIds: string[];
  familyAccountIds: string[];
  studentIds: string[];
  isDisabled: boolean;
};
