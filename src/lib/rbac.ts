/**
 * Role-based access control helpers for API routes.
 *
 * Role hierarchy (highest to lowest):
 *   ADMIN > MANAGER > SALES_EXECUTIVE
 *
 * Destructive operations (DELETE, sensitive PATCH) require ADMIN or MANAGER.
 */

export const ROLES = {
  ADMIN:           "ADMIN",
  MANAGER:         "MANAGER",
  SALES_EXECUTIVE: "SALES_EXECUTIVE",
} as const;

/** Roles that can perform destructive operations */
const DESTRUCTIVE_ROLES = [ROLES.ADMIN, ROLES.MANAGER];

/**
 * Returns true if the given role is allowed to perform destructive operations
 * (delete records, force-cancel, hard-delete).
 */
export function canDelete(role: string | undefined | null): boolean {
  if (!role) return false;
  return DESTRUCTIVE_ROLES.includes(role as any);
}

/**
 * Returns true if the given role is ADMIN-only (system settings, user management).
 */
export function isAdmin(role: string | undefined | null): boolean {
  return role === ROLES.ADMIN;
}
