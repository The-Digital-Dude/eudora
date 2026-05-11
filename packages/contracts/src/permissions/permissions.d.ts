export declare const PERMISSIONS: {
    readonly STUDENT_PROFILE_VIEW: "student.profile.view";
    readonly AUDIT_VIEW: "audit.view";
};
export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];
