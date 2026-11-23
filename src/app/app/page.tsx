import { redirect } from "next/navigation";
import { hasPermission, requireAuthorizationContext } from "@/server/authorization";

/** Default landing order for multi-role users: Admin, then Teacher, then Student. */
export default async function LegacyAppLanding() {
  let context; try { context = await requireAuthorizationContext(); } catch { redirect("/sign-in"); }
  if (hasPermission(context, "admin.access")) redirect("/admin");
  if (hasPermission(context, "classes.read.own")) redirect("/teacher");
  if (hasPermission(context, "classes.read.enrolled")) redirect("/student");
  redirect("/app/settings");
}
