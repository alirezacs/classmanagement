import "server-only";
import { hashPassword } from "@better-auth/utils/password";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/server/db";
import { writeAudit } from "@/server/audit";
import { AccessDeniedError, hasPermission, requirePermission, type AuthorizationContext } from "@/server/authorization";
import { canDelegate, isAccessManager, isPermissionKey, PERMISSIONS, type PermissionKey } from "@/server/permissions";
import { classInput, pageInput, updateClassInput } from "@/server/services/classes";

export class AdminOperationError extends Error { override readonly name = "AdminOperationError"; }
const roleInput = z.object({ name: z.string().trim().min(2).max(80), description: z.string().trim().max(500).nullable().optional() });
const userInput = z.object({ name: z.string().trim().min(1).max(160), email: z.string().trim().email().max(320), password: z.string().min(8).max(128).optional() });
type Tx = Prisma.TransactionClient;

async function actor(permission: PermissionKey) { return requirePermission(permission); }
function ensureDelegable(context: AuthorizationContext, keys: readonly string[]) { if (!canDelegate(context.permissions, keys)) throw new AccessDeniedError("Not found"); }
async function roleWithPermissions(tx: Tx | typeof db, roleId: string) { const role = await tx.role.findUnique({ where: { id: roleId }, include: { permissions: { select: { permissionKey: true } } } }); if (!role) throw new AdminOperationError("Role not found"); return role; }
async function assertAccessManagerExists(tx: Tx) {
  const users = await tx.user.findMany({ where: { disabledAt: null }, select: { roles: { select: { role: { select: { permissions: { select: { permissionKey: true } } } } } } } });
  const count = users.filter((user) => isAccessManager(user.roles.flatMap((item) => item.role.permissions.map((permission) => permission.permissionKey)))).length;
  if (count < 1) throw new AdminOperationError("This change would remove the last active access manager");
}

export async function listRoles() {
  await actor("roles.read");
  return db.role.findMany({ orderBy: [{ isSystem: "desc" }, { name: "asc" }], include: { permissions: { select: { permissionKey: true } }, _count: { select: { users: true } } } });
}
export async function createRole(input: unknown) {
  const context = await actor("roles.create"); const value = roleInput.parse(input);
  const key = `custom-${value.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 8)}`;
  return db.$transaction(async (tx) => { const role = await tx.role.create({ data: { key, name: value.name, description: value.description ?? null } }); await writeAudit({ actorId: context.id, action: "role.create", targetType: "Role", targetId: role.id, details: { name: role.name } }, tx); return role; });
}
export async function updateRole(roleId: string, input: unknown) {
  const context = await actor("roles.update"); const value = roleInput.parse(input); const role = await roleWithPermissions(db, roleId); ensureDelegable(context, role.permissions.map((item) => item.permissionKey));
  if (role.isSystem) throw new AdminOperationError("System role names and descriptions are protected");
  return db.$transaction(async (tx) => { const updated = await tx.role.update({ where: { id: roleId }, data: { name: value.name, description: value.description ?? null } }); await writeAudit({ actorId: context.id, action: "role.update", targetType: "Role", targetId: roleId, details: { name: updated.name } }, tx); return updated; });
}
export async function setRolePermissions(roleId: string, permissionKeys: unknown) {
  const context = await actor("permissions.assign");
  const keys = z.array(z.string()).max(PERMISSIONS.length).parse(permissionKeys);
  if (keys.some((key) => !isPermissionKey(key))) throw new AdminOperationError("Unknown permission definition");
  ensureDelegable(context, keys);
  const existing = await roleWithPermissions(db, roleId); ensureDelegable(context, existing.permissions.map((item) => item.permissionKey));
  return db.$transaction(async (tx) => {
    await tx.rolePermission.deleteMany({ where: { roleId } });
    if (keys.length) await tx.rolePermission.createMany({ data: keys.map((permissionKey) => ({ roleId, permissionKey, grantedById: context.id })) });
    await assertAccessManagerExists(tx);
    await writeAudit({ actorId: context.id, action: "role.permissions.update", targetType: "Role", targetId: roleId, details: { before: existing.permissions.map((item) => item.permissionKey), after: keys } }, tx);
    return roleWithPermissions(tx, roleId);
  }, { isolationLevel: "Serializable" });
}
export async function deleteRole(roleId: string) {
  const context = await actor("roles.delete"); const role = await roleWithPermissions(db, roleId); ensureDelegable(context, role.permissions.map((item) => item.permissionKey));
  if (role.isSystem) throw new AdminOperationError("System roles cannot be deleted");
  return db.$transaction(async (tx) => { if (await tx.userRole.count({ where: { roleId } })) throw new AdminOperationError("Remove every user assignment before deleting this role"); await tx.role.delete({ where: { id: roleId } }); await writeAudit({ actorId: context.id, action: "role.delete", targetType: "Role", targetId: roleId, details: { name: role.name } }, tx); return { deleted: true }; });
}
export async function setUserRole(userId: string, roleId: string, assigned: boolean) {
  const context = await actor("roles.assign"); const role = await roleWithPermissions(db, roleId); ensureDelegable(context, role.permissions.map((item) => item.permissionKey));
  return db.$transaction(async (tx) => {
    const target = await tx.user.findUnique({ where: { id: userId }, select: { id: true } }); if (!target) throw new AdminOperationError("User not found");
    if (assigned) await tx.userRole.upsert({ where: { userId_roleId: { userId, roleId } }, update: { assignedById: context.id, assignedAt: new Date() }, create: { userId, roleId, assignedById: context.id } });
    else await tx.userRole.deleteMany({ where: { userId, roleId } });
    await assertAccessManagerExists(tx);
    await writeAudit({ actorId: context.id, action: assigned ? "user.role.assign" : "user.role.remove", targetType: "User", targetId: userId, details: { roleId, role: role.key } }, tx);
    return { assigned };
  }, { isolationLevel: "Serializable" });
}

export async function listUsers(query: unknown) {
  await actor("users.read"); const { page, pageSize, search } = pageInput.parse(query); const input = z.object({ status: z.enum(["active", "disabled"]).optional(), role: z.string().optional() }).parse(query);
  const where: Prisma.UserWhereInput = { ...(input.status === "disabled" ? { disabledAt: { not: null } } : input.status === "active" ? { disabledAt: null } : {}), ...(input.role ? { roles: { some: { role: { key: input.role } } } } : {}), ...(search ? { OR: [{ name: { contains: search, mode: "insensitive" } }, { email: { contains: search, mode: "insensitive" } }] } : {}) };
  const [items, total] = await db.$transaction([db.user.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, select: { id: true, name: true, email: true, locale: true, emailVerified: true, disabledAt: true, createdAt: true, roles: { select: { role: { select: { id: true, key: true, name: true } } } }, _count: { select: { ownedClasses: true, enrollments: true } } } }), db.user.count({ where })]);
  return { items, total, page, pageSize };
}
export async function createUser(input: unknown) {
  const context = await actor("users.create"); const value = userInput.parse(input); const email = value.email.toLowerCase(); const passwordHash = value.password ? await hashPassword(value.password) : null;
  return db.$transaction(async (tx) => { const user = await tx.user.create({ data: { name: value.name, email, emailVerified: false } }); if (passwordHash) await tx.account.create({ data: { userId: user.id, accountId: user.id, providerId: "credential", password: passwordHash } }); await writeAudit({ actorId: context.id, action: "user.create", targetType: "User", targetId: user.id, details: { email, credentialCreated: Boolean(passwordHash), emailVerified: false } }, tx); return user; });
}
export async function updateUserProfile(userId: string, input: unknown) {
  const context = await actor("users.update"); const value = z.object({ name: z.string().trim().min(1).max(160), locale: z.string().trim().min(2).max(20).optional() }).parse(input);
  return db.$transaction(async (tx) => { const data = { name: value.name, ...(value.locale ? { locale: value.locale } : {}) }; const user = await tx.user.update({ where: { id: userId }, data }); await writeAudit({ actorId: context.id, action: "user.update", targetType: "User", targetId: userId, details: { fields: Object.keys(data) } }, tx); return user; });
}
export async function updateUserEmail(userId: string, emailInput: unknown) {
  const context = await actor("users.email.update"); const email = z.string().trim().email().max(320).parse(emailInput).toLowerCase();
  return db.$transaction(async (tx) => { const previous = await tx.user.findUniqueOrThrow({ where: { id: userId }, select: { email: true } }); const user = await tx.user.update({ where: { id: userId }, data: { email, emailVerified: false } }); await tx.authSession.deleteMany({ where: { userId } }); await writeAudit({ actorId: context.id, action: "user.email.update", targetType: "User", targetId: userId, details: { previousEmail: previous.email, email, emailVerified: false, sessionsRevoked: true } }, tx); return user; });
}
export async function setUserPassword(userId: string, passwordInput: unknown) {
  const context = await actor("users.password.set"); const password = z.string().min(8).max(128).parse(passwordInput); const hash = await hashPassword(password);
  return db.$transaction(async (tx) => { const user = await tx.user.findUniqueOrThrow({ where: { id: userId } }); const account = await tx.account.findFirst({ where: { userId, providerId: "credential" } }); if (account) await tx.account.update({ where: { id: account.id }, data: { password: hash } }); else await tx.account.create({ data: { userId, providerId: "credential", accountId: user.id, password: hash } }); await tx.authSession.deleteMany({ where: { userId } }); await writeAudit({ actorId: context.id, action: "user.password.set", targetType: "User", targetId: userId, details: { sessionsRevoked: true } }, tx); return { updated: true }; });
}
export async function setUserDisabled(userId: string, disabled: boolean, reason?: string) {
  const context = await actor("users.status.update"); if (context.id === userId && disabled) throw new AdminOperationError("You cannot deactivate your own account");
  return db.$transaction(async (tx) => { const user = await tx.user.update({ where: { id: userId }, data: { disabledAt: disabled ? new Date() : null, disabledReason: disabled ? reason?.slice(0, 500) ?? "Administrative action" : null } }); if (disabled) await tx.authSession.deleteMany({ where: { userId } }); await assertAccessManagerExists(tx); await writeAudit({ actorId: context.id, action: disabled ? "user.deactivate" : "user.reactivate", targetType: "User", targetId: userId, details: { sessionsRevoked: disabled } }, tx); return user; }, { isolationLevel: "Serializable" });
}
export async function deleteUser(userId: string) {
  const context = await actor("users.delete"); if (context.id === userId) throw new AdminOperationError("You cannot delete your own account");
  return db.$transaction(async (tx) => { const user = await tx.user.findUnique({ where: { id: userId }, select: { email: true, _count: { select: { ownedClasses: true, enrollments: true, invitationsSent: true } } } }); if (!user) throw new AdminOperationError("User not found"); const dependencies = user._count; if (dependencies.ownedClasses || dependencies.enrollments || dependencies.invitationsSent) throw new AdminOperationError("This user has retained class history. Deactivate the account, or reassign owned classes and resolve related records before permanent deletion."); await tx.user.delete({ where: { id: userId } }); await assertAccessManagerExists(tx); await writeAudit({ actorId: context.id, action: "user.delete", targetType: "User", targetId: userId, details: { email: user.email } }, tx); return { deleted: true }; }, { isolationLevel: "Serializable" });
}

export async function listAllClasses(query: unknown) {
  await actor("classes.read.all"); const { page, pageSize, search } = pageInput.parse(query); const input = z.object({ teacherId: z.string().optional(), status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional() }).parse(query);
  const where: Prisma.ClassWhereInput = { ...(input.teacherId ? { ownerId: input.teacherId } : {}), ...(input.status ? { status: input.status } : {}), ...(search ? { OR: [{ title: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }, { owner: { name: { contains: search, mode: "insensitive" } } }] } : {}) };
  const [items, total] = await db.$transaction([db.class.findMany({ where, orderBy: [{ owner: { name: "asc" } }, { updatedAt: "desc" }], skip: (page - 1) * pageSize, take: pageSize, include: { owner: { select: { id: true, name: true, email: true } }, _count: { select: { enrollments: { where: { status: "ACTIVE" } }, classSessions: true } } } }), db.class.count({ where })]); return { items, total, page, pageSize };
}
export async function createClassForTeacher(input: unknown) {
  const context = await actor("classes.create.any"); const value = classInput.and(z.object({ ownerId: z.string().min(1) })).parse(input); const teacher = await db.user.findFirst({ where: { id: value.ownerId, disabledAt: null, roles: { some: { role: { key: "teacher" } } } } }); if (!teacher) throw new AdminOperationError("Select an active user with the Teacher role");
  return db.$transaction(async (tx) => { const item = await tx.class.create({ data: { ownerId: value.ownerId, title: value.title, description: value.description ?? null, timeZone: value.timeZone, startsOn: value.startsOn ?? null, endsOn: value.endsOn ?? null } }); await writeAudit({ actorId: context.id, action: "class.create.admin", targetType: "Class", targetId: item.id, details: { ownerId: item.ownerId } }, tx); return item; });
}
export async function updateAnyClass(classId: string, input: unknown) {
  const context = await actor("classes.update.any"); const value = updateClassInput.and(z.object({ ownerId: z.string().optional() })).parse(input); const existing = await db.class.findUniqueOrThrow({ where: { id: classId } }); if (value.ownerId && value.ownerId !== existing.ownerId) { const teacher = await db.user.findFirst({ where: { id: value.ownerId, disabledAt: null, roles: { some: { role: { key: "teacher" } } } } }); if (!teacher) throw new AdminOperationError("The new owner must be an active Teacher"); }
  return db.$transaction(async (tx) => { const item = await tx.class.update({ where: { id: classId }, data: Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined)) }); if (item.ownerId !== existing.ownerId) await writeAudit({ actorId: context.id, action: "class.owner.update", targetType: "Class", targetId: classId, details: { previousOwnerId: existing.ownerId, ownerId: item.ownerId } }, tx); else await writeAudit({ actorId: context.id, action: "class.update.admin", targetType: "Class", targetId: classId, details: { fields: Object.keys(value) } }, tx); return item; });
}
export async function listAudit(query: unknown) {
  await actor("audit.read"); const { page, pageSize } = pageInput.parse(query); const input = z.object({ action: z.string().trim().max(100).optional(), actorId: z.string().optional(), targetType: z.string().max(80).optional() }).parse(query); const where: Prisma.AuditLogWhereInput = { ...(input.action ? { action: { contains: input.action, mode: "insensitive" } } : {}), ...(input.actorId ? { actorId: input.actorId } : {}), ...(input.targetType ? { targetType: input.targetType } : {}) }; const [items, total] = await db.$transaction([db.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: { actor: { select: { name: true, email: true } } } }), db.auditLog.count({ where })]); return { items, total, page, pageSize };
}
export async function adminSummary() {
  const context = await requirePermission("admin.access"); const can = (key: PermissionKey) => hasPermission(context, key);
  const [users, classes, roles, pendingInvitations, recentAudit] = await Promise.all([can("users.read") ? db.user.count() : null, can("classes.read.all") ? db.class.count() : null, can("roles.read") ? db.role.count() : null, can("classes.read.all") ? db.invitation.count({ where: { status: "PENDING" } }) : null, can("audit.read") ? db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { actor: { select: { name: true } } } }) : []]); return { users, classes, roles, pendingInvitations, recentAudit };
}
