export function isAdminEmail(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)

  return adminEmails.includes(email.trim().toLowerCase())
}

// ADMIN_EMAILS is authoritative for granting admin: an address listed there is
// an admin even if its user document was created before it was added (the
// stored role is only set at account creation). A stored "admin" role is kept
// so admins promoted directly in Appwrite keep access.
export function resolveRole(email: string | null | undefined, storedRole?: string | null): "admin" | "user" {
  if (email && isAdminEmail(email)) return "admin"
  return storedRole === "admin" ? "admin" : "user"
}
