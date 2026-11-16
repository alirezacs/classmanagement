import "server-only";
import { randomBytes } from "node:crypto";
import { z } from "zod";
import { hashPassword } from "@better-auth/utils/password";
import { db } from "@/server/db";
import type { EnrollmentStatus } from "@/generated/prisma/enums";
import { AccessDeniedError, requireActiveEnrollment, requireClassAccess, requireClassOwner } from "@/server/authorization";

export const classInput = z.object({ title: z.string().trim().min(1).max(160), description: z.string().trim().max(5000).nullable().optional(), timeZone: z.string().trim().min(1).max(80), startsOn: z.coerce.date().nullable().optional(), endsOn: z.coerce.date().nullable().optional() }).superRefine((value, ctx) => { if (value.startsOn && value.endsOn && value.endsOn < value.startsOn) ctx.addIssue({ code: "custom", path: ["endsOn"], message: "End date must be after start date" }); });
export const pageInput = z.object({ page: z.coerce.number().int().min(1).default(1), pageSize: z.coerce.number().int().min(1).max(100).default(20), search: z.string().trim().max(100).default("") });
const manualStudentInput = z.object({ name: z.string().trim().min(1).max(160), email: z.string().trim().email().max(320), temporaryPassword: z.string().min(8).max(128).optional() });

function archivedWriteDenied(status: string): never { if (status === "ARCHIVED") throw new AccessDeniedError("Not found"); throw new Error("Unexpected class status"); }

export async function listOwnedClasses(userId: string, query: unknown) {
  const { page, pageSize, search } = pageInput.parse(query);
  const where = { ownerId: userId, ...(search ? { OR: [{ title: { contains: search, mode: "insensitive" as const } }, { description: { contains: search, mode: "insensitive" as const } }] } : {}) };
  const [items, total] = await db.$transaction([db.class.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: { _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } } }), db.class.count({ where })]);
  return { items: items.map((item) => ({ id: item.id, title: item.title, description: item.description, status: item.status, timeZone: item.timeZone, startsOn: item.startsOn, endsOn: item.endsOn, updatedAt: item.updatedAt, studentCount: item._count.enrollments })), page, pageSize, total };
}

export async function listStudentClasses(userId: string, query: unknown) {
  const { page, pageSize, search } = pageInput.parse(query);
  const where = { studentId: userId, status: "ACTIVE" as const, class: { status: { not: "ARCHIVED" as const }, ...(search ? { OR: [{ title: { contains: search, mode: "insensitive" as const } }, { description: { contains: search, mode: "insensitive" as const } }] } : {}) } };
  const [items, total] = await db.$transaction([db.enrollment.findMany({ where, orderBy: { updatedAt: "desc" }, skip: (page - 1) * pageSize, take: pageSize, include: { class: { include: { owner: { select: { name: true, image: true } }, _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } } } } }), db.enrollment.count({ where })]);
  return { items: items.map((item) => ({ id: item.class.id, title: item.class.title, description: item.class.description, status: item.class.status, timeZone: item.class.timeZone, teacher: item.class.owner, studentCount: item.class._count.enrollments })), page, pageSize, total };
}

export async function createClass(userId: string, input: unknown) { const value = classInput.parse(input); return db.class.create({ data: { title: value.title, timeZone: value.timeZone, ownerId: userId, status: "DRAFT", ...(value.description !== undefined ? { description: value.description } : {}), ...(value.startsOn !== undefined ? { startsOn: value.startsOn } : {}), ...(value.endsOn !== undefined ? { endsOn: value.endsOn } : {}) } }); }

export async function updateOwnedClass(userId: string, classId: string, input: unknown) {
  const existing = await requireClassOwner(userId, classId); archivedWriteDenied(existing.status);
  const value = classInput.partial().extend({ status: z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]).optional() }).parse(input);
  const data = Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined));
  return db.class.update({ where: { id: classId }, data });
}

export async function getClassSummary(userId: string, classId: string) {
  const access = await requireClassAccess(userId, classId);
  const counts = await db.enrollment.groupBy({ by: ["status"], where: { classId }, _count: { _all: true } });
  return { id: access.classRecord.id, title: access.classRecord.title, description: access.classRecord.description, status: access.classRecord.status, timeZone: access.classRecord.timeZone, startsOn: access.classRecord.startsOn, endsOn: access.classRecord.endsOn, role: access.role, enrollmentCounts: Object.fromEntries(counts.map((item) => [item.status, item._count._all])) };
}

export async function listClassRoster(userId: string, classId: string, query: unknown) {
  const access = await requireClassAccess(userId, classId);
  const { page, pageSize, search } = pageInput.parse(query);
  const statuses: EnrollmentStatus[] = access.role === "OWNER" ? ["ACTIVE", "WITHDRAWN", "REMOVED"] : ["ACTIVE"];
  const where = { classId, status: { in: statuses }, ...(search ? { student: { name: { contains: search, mode: "insensitive" as const } } } : {}) };
  const rows = await db.enrollment.findMany({ where, orderBy: { student: { name: "asc" } }, skip: (page - 1) * pageSize, take: pageSize, select: { id: true, status: true, enrolledAt: true, student: { select: { name: true, image: true } } } });
  const total = await db.enrollment.count({ where });
  const absenceCounts = access.role === "OWNER" ? await db.attendance.groupBy({ by: ["enrollmentId"], where: { classId, enrollmentId: { in: rows.map((row) => row.id) }, status: "ABSENT" }, _count: { _all: true } }) : [];
  const absenceMap = new Map(absenceCounts.map((item) => [item.enrollmentId, item._count._all]));
  return { role: access.role, items: rows.map((row) => access.role === "OWNER" ? ({ id: row.id, status: row.status, enrolledAt: row.enrolledAt, absenceCount: absenceMap.get(row.id) ?? 0, student: { name: row.student.name, image: row.student.image } }) : ({ student: { name: row.student.name, image: row.student.image } })), page, pageSize, total };
}

export async function removeEnrollment(userId: string, classId: string, enrollmentId: string) {
  await requireClassOwner(userId, classId);
  return db.enrollment.updateMany({ where: { id: enrollmentId, classId, status: "ACTIVE" }, data: { status: "REMOVED", withdrawnAt: new Date() } });
}

export async function manuallyEnrollStudent(userId: string, classId: string, input: unknown) {
  const classRecord = await requireClassOwner(userId, classId);
  if (classRecord.status === "ARCHIVED") throw new AccessDeniedError("Not found");
  const value = manualStudentInput.parse(input);
  const email = value.email.toLowerCase();
  const temporaryPassword = value.temporaryPassword ?? randomBytes(12).toString("base64url");
  const result = await db.$transaction(async (tx) => {
    let student = await tx.user.findUnique({ where: { email }, include: { accounts: { where: { providerId: "credential" }, take: 1 } } });
    let passwordIssued = false;
    if (!student) {
      student = await tx.user.create({ data: { name: value.name, email, emailVerified: true } , include: { accounts: { where: { providerId: "credential" }, take: 1 } } });
    }
    if (!student.accounts[0]) {
      await tx.account.create({ data: { userId: student.id, accountId: student.id, providerId: "credential", password: await hashPassword(temporaryPassword) } });
      passwordIssued = true;
    }
    const enrollment = await tx.enrollment.upsert({ where: { classId_studentId: { classId, studentId: student.id } }, update: { status: "ACTIVE", withdrawnAt: null, enrolledAt: new Date() }, create: { classId, studentId: student.id, status: "ACTIVE" } });
    return { enrollment, student, passwordIssued };
  });
  return { enrollmentId: result.enrollment.id, student: { id: result.student.id, name: result.student.name, email: result.student.email }, temporaryPassword: result.passwordIssued ? temporaryPassword : null };
}

export async function assertStudentClassAccess(userId: string, classId: string) { await requireActiveEnrollment(userId, classId); }

