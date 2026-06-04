import { NextRequest, NextResponse } from "next/server";
import { auth } from "./auth";

// ── requireAdmin ─────────────────────────────────────────────────────────────
// Validates the session and confirms admin role. Returns the session if valid,
// or throws a NextResponse error if not. Use in admin API routes.
//
// Usage:
//   const session = await requireAdmin();
//   if (session instanceof NextResponse) return session;
//
export async function requireAdmin(): Promise<any> {
  const session = await auth();

  if (!session) {
    return NextResponse.json(
      { error: "Authentication required" },
      { status: 401 }
    );
  }

  const userRole = (session.user as any)?.role;
  const userEmail = session.user?.email?.toLowerCase().trim() ?? "";
  const adminEmail = (process.env.ADMIN_EMAIL ?? "").toLowerCase();

  const isAdmin = userEmail === adminEmail || userRole === "admin";

  if (!isAdmin) {
    return NextResponse.json(
      { error: "Admin privileges required" },
      { status: 403 }
    );
  }

  return session;
}

// ── withMethodCheck ──────────────────────────────────────────────────────────
// Returns a 405 Method Not Allowed response if the request method is not in
// the allowed list. Use as a guard at the top of route handlers.
//
// Usage:
//   const methodError = withMethodCheck(req, ["GET", "POST"]);
//   if (methodError) return methodError;
//
export function withMethodCheck(
  req: NextRequest,
  allowed: string[]
): NextResponse | null {
  if (!allowed.includes(req.method)) {
    return NextResponse.json(
      { error: `Method ${req.method} not allowed` },
      {
        status: 405,
        headers: { Allow: allowed.join(", ") },
      }
    );
  }
  return null;
}

// ── safeErrorResponse ────────────────────────────────────────────────────────
// Logs the full error server-side but only returns a generic message to the
// client. Prevents stack traces, file paths, and internal details from leaking.
//
// Usage:
//   } catch (error) {
//     return safeErrorResponse(error, "Failed to load products");
//   }
//
export function safeErrorResponse(
  error: unknown,
  clientMessage: string,
  statusCode = 500
): NextResponse {
  // Log full error details on the server — never send to client
  console.error(`[API Error] ${clientMessage}:`, error);

  return NextResponse.json(
    { error: clientMessage },
    { status: statusCode }
  );
}

// ── validateRequiredFields ────────────────────────────────────────────────────
// Checks that all required string fields are present and non-empty in the body.
// Returns a 400 response if any are missing.
//
// Usage:
//   const validation = validateRequiredFields(body, ["title", "price"]);
//   if (validation) return validation;
//
export function validateRequiredFields(
  body: Record<string, unknown>,
  requiredFields: string[]
): NextResponse | null {
  const missing = requiredFields.filter(
    (field) => !body[field] || body[field] === ""
  );

  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  return null;
}
