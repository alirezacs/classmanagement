import { PageHeader } from "@/components/ui/page-header";
import { RoleManager } from "@/components/admin-console";
import { RoleMetadataEditor } from "@/components/admin-role-tools";
import { listRoles } from "@/server/services/admin";
export default async function RolesPage() { const roles = await listRoles(); return <><PageHeader eyebrow="Access control" title="Roles and permissions" description="Compose roles from registered capabilities. Operators cannot delegate permissions they do not hold." /><RoleMetadataEditor roles={roles} /><RoleManager roles={roles} /></>; }
