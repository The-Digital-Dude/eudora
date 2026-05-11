import type { ActorContext } from "@guidora/contracts";

export type SessionActor = Pick<ActorContext, "userId" | "roles" | "centreIds" | "familyAccountIds" | "studentIds">;

export async function getSessionActor(): Promise<SessionActor | null> {
  return null;
}
