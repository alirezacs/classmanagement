import { ClassWorkspace } from "@/components/class-workspace";
import { ClassOwnerEditor } from "@/components/admin-class-tools";
import { hasPermission, requireAuthorizationContext } from "@/server/authorization";
import { db } from "@/server/db";
export default async function AdminClassPage({ params }: { params: Promise<{ classId: string }> }) { const { classId } = await params; const context = await requireAuthorizationContext(); const [item, teachers] = hasPermission(context, "classes.update.any") ? await Promise.all([db.class.findUniqueOrThrow({ where: { id: classId }, select: { ownerId: true } }), db.user.findMany({ where: { disabledAt: null, roles: { some: { role: { key: "teacher" } } } }, orderBy: { name: "asc" }, select: { id: true, name: true, email: true } })]) : [null, []]; return <>{item && <ClassOwnerEditor classId={classId} ownerId={item.ownerId} teachers={teachers} />}<ClassWorkspace classId={classId} admin /></>; }
