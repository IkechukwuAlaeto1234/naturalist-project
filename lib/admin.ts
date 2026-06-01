const FALLBACK_ADMIN_EMAIL = "ikechukwualaeto@gmail.com";

function normalizeEmail(email?: string | null) {
  return email?.toLowerCase().trim() || "";
}

export function getAdminEmails() {
  const configured = [
    process.env.ADMIN_EMAIL,
    process.env.NEXT_PUBLIC_ADMIN_EMAIL,
    process.env.ADMIN_EMAILS,
  ]
    .filter(Boolean)
    .join(",");

  return new Set(
    (configured || FALLBACK_ADMIN_EMAIL)
      .split(",")
      .map((email) => normalizeEmail(email))
      .filter(Boolean)
  );
}

export function isAdminEmail(email?: string | null) {
  return getAdminEmails().has(normalizeEmail(email));
}

export function resolveUserRole(role?: string | null, email?: string | null): "user" | "admin" {
  return role === "admin" || isAdminEmail(email) ? "admin" : "user";
}

export function hasAdminAccess(user?: { role?: string | null; email?: string | null } | null) {
  return resolveUserRole(user?.role, user?.email) === "admin";
}
