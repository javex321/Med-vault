import type { Permission, UserRole } from "@medvault/shared";

const rolePermissions: Record<UserRole, Permission[]> = {
  patient: [
    "profile:read",
    "profile:update",
    "timeline:read",
    "timeline:create",
    "timeline:update",
    "medications:read",
    "medications:create",
    "medications:update",
    "notifications:read",
    "notifications:update",
    "documents:read",
    "documents:upload",
    "documents:update",
    "sharing:create",
    "consent:manage"
  ],
  family_member: ["profile:read", "timeline:read", "medications:read", "notifications:read", "documents:read"],
  clinician: ["profile:read", "timeline:read", "medications:read", "notifications:read", "documents:read"],
  admin: [
    "profile:read",
    "profile:update",
    "timeline:read",
    "timeline:create",
    "timeline:update",
    "medications:read",
    "medications:create",
    "medications:update",
    "notifications:read",
    "notifications:update",
    "documents:read",
    "documents:upload",
    "documents:update",
    "sharing:create",
    "consent:manage",
    "audit:read"
  ]
};

export function getPermissionsForRole(role: UserRole) {
  return rolePermissions[role];
}
