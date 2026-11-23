import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin-shell";
import { hasPermission, requireAuthorizationContext } from "@/server/authorization";

export const dynamic = "force-dynamic";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  let context; try { context = await requireAuthorizationContext(); } catch { redirect("/sign-in?next=/admin"); }
  if (!hasPermission(context, "admin.access")) redirect(hasPermission(context, "classes.read.own") ? "/teacher" : hasPermission(context, "classes.read.enrolled") ? "/student" : "/sign-in");
  const areas = [{ href: "/admin", label: "Admin" }, ...(hasPermission(context, "classes.read.own") ? [{ href: "/teacher", label: "Teacher" }] : []), ...(hasPermission(context, "classes.read.enrolled") ? [{ href: "/student", label: "Student" }] : [])];
  return <AdminShell userName={context.name} areas={areas} permissions={[...context.permissions]}>{children}</AdminShell>;
}
