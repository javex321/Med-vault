import type { Permission, UserRole } from "@medvault/shared";

export type { Permission, UserRole };

export type AuthContext = {
  userId: string;
  activeProfileId: string;
  role: UserRole;
  permissions: Permission[];
};
