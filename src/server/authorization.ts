import "server-only";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { db } from "@/server/db";

export class AccessDeniedError extends Error { override readonly name = "AccessDeniedError"; }
export class AuthenticationRequiredError extends Error { override readonly name = "AuthenticationRequiredError"; }
export interface AuthenticatedUser { readonly id: string; readonly email: string; readonly name: string; }

/** Never distinguish missing resources from resources the caller cannot read. */
function inaccessible(): never { throw new AccessDeniedError("Not found"); }

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new AuthenticationRequiredError("Authentication required");
  return { id: session.user.id, email: session.user.email, name: session.user.name };
}

export async function requireClassOwner(userId: string, classId: string) {
  const classRecord = await db.class.findFirst({ where: { id: classId, ownerId: userId } });
  return classRecord ?? inaccessible();
}

export async function requireActiveEnrollment(userId: string, classId: string) {
  const enrollment = await db.enrollment.findFirst({ where: { classId, studentId: userId, status: "ACTIVE" } });
  return enrollment ?? inaccessible();
}

export async function requireClassAccess(userId: string, classId: string) {
  const owned = await db.class.findFirst({ where: { id: classId, ownerId: userId } });
  if (owned) return { classRecord: owned, role: "OWNER" as const, enrollment: null };
  const enrollment = await db.enrollment.findFirst({ where: { classId, studentId: userId, status: "ACTIVE" }, include: { class: true } });
  if (!enrollment) return inaccessible();
  return { classRecord: enrollment.class, role: "STUDENT" as const, enrollment };
}

export async function requireSessionAccess(userId: string, classSessionId: string) {
  const resource = await db.classSession.findFirst({ where: { id: classSessionId } });
  if (!resource) return inaccessible();
  const access = await requireClassAccess(userId, resource.classId);
  if (access.role === "STUDENT" && resource.status === "CANCELLED") return inaccessible();
  return resource;
}
export async function requireTeacherWriteAccess(userId: string, classId: string) { return requireClassOwner(userId, classId); }

