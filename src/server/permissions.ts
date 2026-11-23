const DEFINITIONS = [
  { key: "admin.access", resource: "Admin", action: "access", description: "Open the Admin area. Administrative actions still require their own permissions.", sensitive: true },
  { key: "users.read", resource: "Users", action: "read", description: "View user profiles, account state, roles, and class relationships." },
  { key: "users.create", resource: "Users", action: "create", description: "Create application accounts.", sensitive: true },
  { key: "users.update", resource: "Users", action: "update", description: "Edit non-security profile fields." },
  { key: "users.delete", resource: "Users", action: "delete", description: "Permanently delete users only when no retained records depend on them.", sensitive: true },
  { key: "users.email.update", resource: "Users", action: "email.update", description: "Change a user's sign-in email, mark it unverified, and revoke sessions.", sensitive: true },
  { key: "users.password.set", resource: "Users", action: "password.set", description: "Replace a credential password and revoke every session.", sensitive: true },
  { key: "users.password.reset.send", resource: "Users", action: "password.reset.send", description: "Send a password-reset email subject to persistent rate limits.", sensitive: true },
  { key: "users.status.update", resource: "Users", action: "status.update", description: "Deactivate or reactivate an account. Deactivation revokes sessions.", sensitive: true },
  { key: "roles.read", resource: "Roles", action: "read", description: "View roles, their permissions, and assigned user counts." },
  { key: "roles.create", resource: "Roles", action: "create", description: "Create custom roles." },
  { key: "roles.update", resource: "Roles", action: "update", description: "Rename and describe custom roles." },
  { key: "roles.delete", resource: "Roles", action: "delete", description: "Delete an unused custom role.", sensitive: true },
  { key: "roles.assign", resource: "Roles", action: "assign", description: "Assign roles whose permissions are within the operator's own authority.", sensitive: true },
  { key: "permissions.assign", resource: "Roles", action: "permissions.assign", description: "Compose roles without granting capabilities beyond the operator's own authority.", sensitive: true },
  { key: "classes.read.own", resource: "Classes", action: "read.own", description: "View classes owned by the user." },
  { key: "classes.read.enrolled", resource: "Classes", action: "read.enrolled", description: "View non-archived classes with an active enrollment." },
  { key: "classes.read.all", resource: "Classes", action: "read.all", description: "View every class and its administrative metadata.", sensitive: true },
  { key: "classes.create.own", resource: "Classes", action: "create.own", description: "Create a class owned by the current user." },
  { key: "classes.create.any", resource: "Classes", action: "create.any", description: "Create a class on behalf of a selected teacher.", sensitive: true },
  { key: "classes.update.own", resource: "Classes", action: "update.own", description: "Edit classes owned by the user." },
  { key: "classes.update.any", resource: "Classes", action: "update.any", description: "Edit any class, including ownership.", sensitive: true },
  { key: "enrollments.manage.own", resource: "Enrollments", action: "manage.own", description: "Manage enrollment for owned classes." },
  { key: "enrollments.manage.any", resource: "Enrollments", action: "manage.any", description: "Manage enrollment for any class.", sensitive: true },
  { key: "invitations.manage.own", resource: "Invitations", action: "manage.own", description: "Create, list, and revoke invitations for owned classes." },
  { key: "invitations.manage.any", resource: "Invitations", action: "manage.any", description: "Manage invitations for any class.", sensitive: true },
  { key: "sessions.manage.own", resource: "Sessions", action: "manage.own", description: "Create, edit, order, and generate sessions for owned classes." },
  { key: "sessions.manage.any", resource: "Sessions", action: "manage.any", description: "Manage sessions for any class.", sensitive: true },
  { key: "attendance.manage.own", resource: "Attendance", action: "manage.own", description: "View and edit attendance and private notes for owned classes." },
  { key: "attendance.manage.any", resource: "Attendance", action: "manage.any", description: "View and edit attendance and private notes for any class.", sensitive: true },
  { key: "audit.read", resource: "Audit", action: "read", description: "View the administrative audit trail.", sensitive: true },
] as const;

export type PermissionKey = (typeof DEFINITIONS)[number]["key"];
export const PERMISSIONS: ReadonlyArray<{ key: PermissionKey; resource: string; action: string; description: string; sensitive: boolean }> = DEFINITIONS.map((item) => ({ ...item, sensitive: "sensitive" in item ? item.sensitive : false }));
export const PERMISSION_KEYS = new Set<PermissionKey>(PERMISSIONS.map((item) => item.key));
export const DEFAULT_ROLE_PERMISSIONS: Record<"admin" | "teacher" | "student", readonly PermissionKey[]> = {
  admin: PERMISSIONS.map((item) => item.key),
  teacher: ["classes.read.own", "classes.create.own", "classes.update.own", "enrollments.manage.own", "invitations.manage.own", "sessions.manage.own", "attendance.manage.own"],
  student: ["classes.read.enrolled"],
};
export const ACCESS_MANAGER_PERMISSIONS: readonly PermissionKey[] = ["admin.access", "roles.assign", "permissions.assign"];
export function isPermissionKey(value: string): value is PermissionKey { return PERMISSION_KEYS.has(value as PermissionKey); }
export function canDelegate(operatorPermissions: ReadonlySet<string>, delegatedPermissions: readonly string[]): boolean { return delegatedPermissions.every((key) => operatorPermissions.has(key)); }
export function isAccessManager(permissionKeys: Iterable<string>): boolean { const keys = new Set(permissionKeys); return ACCESS_MANAGER_PERMISSIONS.every((key) => keys.has(key)); }
