import "server-only";
import { db } from "@/server/db";

export async function teacherDashboard(userId: string, now = new Date()) {
  const [activeClasses, students, upcomingSessions, recentSessions, recentEnrollments] = await Promise.all([
    db.class.findMany({ where: { ownerId: userId, status: "ACTIVE" }, orderBy: { updatedAt: "desc" }, include: { _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } } }),
    db.enrollment.count({ where: { status: "ACTIVE", class: { ownerId: userId, status: "ACTIVE" } } }),
    db.classSession.findMany({ where: { class: { ownerId: userId }, status: { not: "CANCELLED" }, startsAt: { gte: now } }, orderBy: { startsAt: "asc" }, take: 6, include: { class: { select: { id: true, title: true, timeZone: true } } } }),
    db.classSession.findMany({ where: { class: { ownerId: userId } }, orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, classId: true, title: true, status: true, updatedAt: true } }),
    db.enrollment.findMany({ where: { class: { ownerId: userId } }, orderBy: { updatedAt: "desc" }, take: 5, select: { id: true, classId: true, status: true, updatedAt: true, student: { select: { name: true } } } }),
  ]);
  const activity = [...recentSessions.map((item) => ({ id: `session-${item.id}`, classId: item.classId, label: `Session · ${item.title}`, detail: item.status.toLowerCase(), at: item.updatedAt })), ...recentEnrollments.map((item) => ({ id: `enrollment-${item.id}`, classId: item.classId, label: `${item.student.name} enrollment`, detail: item.status.toLowerCase(), at: item.updatedAt }))].sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, 8);
  return { activeClasses, activeClassCount: activeClasses.length, activeStudentCount: students, upcomingSessions, activity };
}

export async function studentDashboard(userId: string, now = new Date()) {
  const enrollmentWhere = { studentId: userId, status: "ACTIVE" as const, class: { status: { not: "ARCHIVED" as const } } };
  const [enrollments, upcomingSessions] = await Promise.all([
    db.enrollment.findMany({ where: enrollmentWhere, orderBy: { updatedAt: "desc" }, include: { class: { select: { id: true, title: true, description: true, timeZone: true, owner: { select: { name: true } }, _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } } } } }),
    db.classSession.findMany({ where: { class: { enrollments: { some: { studentId: userId, status: "ACTIVE" } } }, status: { not: "CANCELLED" }, startsAt: { gte: now } }, orderBy: { startsAt: "asc" }, take: 6, include: { class: { select: { id: true, title: true, timeZone: true } } } }),
  ]);
  return { enrollments, enrolledClassCount: enrollments.length, upcomingSessions };
}
