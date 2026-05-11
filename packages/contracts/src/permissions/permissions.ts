export const PERMISSIONS = {
  STUDENT_PROFILE_VIEW: "student.profile.view",
  AUDIT_VIEW: "audit.view"
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
