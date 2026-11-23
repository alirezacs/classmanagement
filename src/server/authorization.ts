import "server-only";
import { headers } from "next/headers";
import { auth } from "@/server/auth";
import { db } from "@/server/db";
import type { PermissionKey } from "@/server/permissions";

export class AccessDeniedError extends Error { override readonly name = "AccessDeniedError"; }
export class AuthenticationRequiredError extends Error { override readonly name = "AuthenticationRequiredError"; }
export interface AuthenticatedUser { readonly id: string; readonly email: string; readonly name: string; }
export interface AuthorizationContext extends AuthenticatedUser { readonly roles: readonly { key: string; name: string }[]; readonly permissions: ReadonlySet<string>; }

function inaccessible(): never { throw new AccessDeniedError("Not found"); }

/** Better Auth establishes identity; account status and RBAC are deliberately read fresh. */
export async function requireAuthorizationContext(): Promise<AuthorizationContext> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new AuthenticationRequiredError("Authentication required");
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, name: true, disabledAt: true, roles: { select: { role: { select: { key: true, name: true, permissions: { select: { permissionKey: true } } } } } } },
  });
  if (!user || user.disabledAt) throw new AuthenticationRequiredError("Authentication required");
  return {
    id: user.id, email: user.email, name: user.name,
    roles: user.roles.map(({ role }) => ({ key: role.key, name: role.name })),
    permissions: new Set(user.roles.flatMap(({ role }) => role.permissions.map((item) => item.permissionKey))),
  };
}

export async function requireAuthenticatedUser(): Promise<AuthenticatedUser> { const { id, email, name } = await requireAuthorizationContext(); return { id, email, name }; }
export function hasPermission(context: Pick<AuthorizationContext, "permissions">, permission: PermissionKey): boolean { return context.permissions.has(permission); }
export async function requirePermission(permission: PermissionKey): Promise<AuthorizationContext> { const context = await requireAuthorizationContext(); if (!hasPermission(context, permission)) inaccessible(); return context; }

export async function requireClassScopedPermission(userId: string, classId: string, own: PermissionKey, any: PermissionKey) {
  const context = await requireAuthorizationContext();
  if (context.id !== userId) inaccessible();
  const classRecord = await db.class.findUnique({ where: { id: classId } });
  if (!classRecord) inaccessible();
  if (hasPermission(context, any) || (classRecord.ownerId === userId && hasPermission(context, own))) return classRecord;
  return inaccessible();
}

export async function requireClassOwner(userId: string, classId: string) { return requireClassScopedPermission(userId, classId, "classes.update.own", "classes.update.any"); }
export async function requireActiveEnrollment(userId: string, classId: string) {
  const context = await requireAuthorizationContext();
  if (context.id !== userId || !hasPermission(context, "classes.read.enrolled")) inaccessible();
  const enrollment = await db.enrollment.findFirst({ where: { classId, studentId: userId, status: "ACTIVE", class: { status: { not: "ARCHIVED" } } } });
  return enrollment ?? inaccessible();
}

export async function requireClassAccess(userId: string, classId: string) {
  const context = await requireAuthorizationContext();
  if (context.id !== userId) inaccessible();
  const classRecord = await db.class.findUnique({ where: { id: classId } });
  if (!classRecord) inaccessible();
  if (hasPermission(context, "classes.read.all") || (classRecord.ownerId === userId && hasPermission(context, "classes.read.own"))) return { classRecord, role: classRecord.ownerId === userId ? "OWNER" as const : "ADMIN" as const, enrollment: null };
  if (!hasPermission(context, "classes.read.enrolled") || classRecord.status === "ARCHIVED") inaccessible();
  const enrollment = await db.enrollment.findFirst({ where: { classId, studentId: userId, status: "ACTIVE" } });
  if (!enrollment) inaccessible();
  return { classRecord, role: "STUDENT" as const, enrollment };
}

export async function requireSessionAccess(userId: string, classSessionId: string) {
  const resource = await db.classSession.findFirst({ where: { id: classSessionId } });
  if (!resource) inaccessible();
  const access = await requireClassAccess(userId, resource.classId);
  if (access.role === "STUDENT" && resource.status === "CANCELLED") inaccessible();
  return resource;
}
export async function requireTeacherWriteAccess(userId: string, classId: string) { return requireClassScopedPermission(userId, classId, "classes.update.own", "classes.update.any"); }
