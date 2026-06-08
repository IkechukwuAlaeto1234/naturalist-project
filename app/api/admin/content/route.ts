export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { Content } from "@/models/Content";
import { Notification } from "@/models/Notification";
import { User } from "@/models/User";
import { auth } from "@/lib/auth";

/* ─── Legal page keys ────────────────────────────────────────────── */
const LEGAL_KEYS = new Set(["privacy-policy", "terms", "cookie-policy", "refund-policy"]);

const LEGAL_PAGE_LABELS: Record<string, string> = {
  "privacy-policy": "Privacy Policy",
  "terms":          "Terms of Service",
  "cookie-policy":  "Cookie Policy",
  "refund-policy":  "Refund Policy",
};

interface LegalSection { heading: string; body: string | string[]; }

type DiffStatus = "added" | "removed" | "modified" | "unchanged";

interface DiffEntry {
  status:     DiffStatus;
  heading:    string;
  oldHeading?: string;
  oldBody?:   string | string[];
  newBody?:   string | string[];
  body?:      string | string[]; // for unchanged
}

function diffSections(oldSections: LegalSection[], newSections: LegalSection[]): DiffEntry[] {
  const result: DiffEntry[] = [];

  // Build a map of old sections keyed by normalised heading
  const oldMap = new Map<string, LegalSection>();
  for (const s of oldSections) {
    oldMap.set(s.heading.trim().toLowerCase(), s);
  }

  const newHeadings = new Set<string>();

  for (const newSec of newSections) {
    const key = newSec.heading.trim().toLowerCase();
    newHeadings.add(key);
    const old = oldMap.get(key);
    if (!old) {
      result.push({ status: "added", heading: newSec.heading, newBody: newSec.body });
    } else {
      const oldStr = JSON.stringify(old.body);
      const newStr = JSON.stringify(newSec.body);
      if (oldStr !== newStr) {
        result.push({ status: "modified", heading: newSec.heading, oldBody: old.body, newBody: newSec.body });
      } else {
        result.push({ status: "unchanged", heading: newSec.heading, body: newSec.body });
      }
    }
  }

  // Sections in old but not in new = removed
  for (const old of oldSections) {
    const key = old.heading.trim().toLowerCase();
    if (!newHeadings.has(key)) {
      result.push({ status: "removed", heading: old.heading, oldBody: old.body });
    }
  }

  return result;
}

async function fireLegalNotification(
  pageKey: string,
  diff: DiffEntry[],
  effectiveDate: string
) {
  const label = LEGAL_PAGE_LABELS[pageKey] ?? pageKey;
  const dateStr = effectiveDate || new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const added   = diff.filter(d => d.status === "added").length;
  const removed = diff.filter(d => d.status === "removed").length;
  const modified = diff.filter(d => d.status === "modified").length;

  // Build a readable change summary for the short message
  const parts: string[] = [];
  if (added)   parts.push(`${added} section${added > 1 ? "s" : ""} added`);
  if (modified) parts.push(`${modified} section${modified > 1 ? "s" : ""} updated`);
  if (removed) parts.push(`${removed} section${removed > 1 ? "s" : ""} removed`);
  const changeSummary = parts.length ? parts.join(", ") : "content refreshed";

  const title   = `${label} Updated`;
  const message = `Our ${label} was updated on ${dateStr} — ${changeSummary}. Review what changed below.`;
  const body    = JSON.stringify({ type: "legal-diff", pageKey, label, effectiveDate: dateStr, diff });
  const link    = `/${pageKey}`;

  // Fan out to all verified, non-suspended users
  const users = await User.find({ isVerified: true, isSuspended: { $ne: true } }, "_id").lean();
  if (!users.length) return;

  const docs = users.map(u => ({
    user:    u._id,
    title,
    message,
    body,
    type:    "legal" as const,
    read:    false,
    link,
  }));

  await Notification.insertMany(docs, { ordered: false });
}

// GET /api/admin/content?key=home
// Fetch a single page content document by key (admin only)
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json(
        { error: "Unauthorized" },
        {
          status: 401,
          headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
        }
      );
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key) {
      return NextResponse.json(
        { error: "Missing key parameter" },
        {
          status: 400,
          headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
        }
      );
    }

    await connectToDatabase();

    const content = await Content.findOne({ key: key.toLowerCase() }).lean();
    return NextResponse.json(content || null, {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
    });
  } catch (error) {
    console.error("GET /api/admin/content error:", error);
    return NextResponse.json(
      { error: "Failed to retrieve content" },
      {
        status: 500,
        headers: { "Cache-Control": "no-store, max-age=0, must-revalidate" },
      }
    );
  }
}

// DELETE /api/admin/content?key=terms&versionId=<id>
// Remove a specific archived version from a page's versions array
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");
    const versionId = searchParams.get("versionId");

    if (!key || !versionId) {
      return NextResponse.json({ error: "key and versionId are required" }, { status: 400 });
    }

    await connectToDatabase();

    const content = await Content.findOne({ key: key.toLowerCase() });
    if (!content) {
      return NextResponse.json({ error: "Content not found" }, { status: 404 });
    }

    const before = content.versions.length;
    content.versions = content.versions.filter(
      (v: any) => String(v._id) !== versionId
    );
    const after = content.versions.length;

    if (before === after) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    await content.save();
    return NextResponse.json({ success: true, deleted: versionId }, { status: 200 });
  } catch (error) {
    console.error("DELETE /api/admin/content error:", error);
    return NextResponse.json({ error: "Failed to delete version" }, { status: 500 });
  }
}

// POST /api/admin/content
// Upsert (create or update) page content by key (admin only)
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { key, title, body: bodyText, images, metadata } = body;

    if (!key || !title) {
      return NextResponse.json({ error: "key and title are required" }, { status: 400 });
    }

    await connectToDatabase();

    const existing = await Content.findOne({ key: key.toLowerCase() });
    let versions = existing ? (existing.versions || []) : [];

    // ── Snapshot for version history ──────────────────────────────
    if (existing && body.isNewVersion !== false) {
      const snapshot = {
        metadata: existing.metadata || {},
        title: existing.title,
        body: existing.body,
        savedAt: existing.updatedAt || new Date(),
        savedBy: (session.user as any).email || "Admin",
        note: body.versionNote || `Updated at ${new Date().toLocaleString()}`,
      };
      versions.push(snapshot);
      if (versions.length > 20) {
        versions = versions.slice(versions.length - 20);
      }
    }

    const content = await Content.findOneAndUpdate(
      { key: key.toLowerCase() },
      {
        key: key.toLowerCase(),
        title,
        body: bodyText || "",
        images: images || [],
        metadata: metadata || {},
        updatedBy: (session.user as any).id,
        versions,
      },
      { upsert: true, new: true, runValidators: true }
    );

    // ── Auto legal-change notification ────────────────────────────
    const normalKey = key.toLowerCase();
    if (LEGAL_KEYS.has(normalKey)) {
      try {
        const oldSections: LegalSection[] = existing?.metadata?.sections ?? [];
        const newSections: LegalSection[] = metadata?.sections ?? [];
        const diff = diffSections(oldSections, newSections);
        const hasChanges = diff.some(d => d.status !== "unchanged");
        if (hasChanges) {
          const effectiveDate: string = metadata?.effectiveDate ?? "";
          // Fire and forget — don't block the save response
          fireLegalNotification(normalKey, diff, effectiveDate).catch(err =>
            console.error("Legal notification fan-out error:", err)
          );
        }
      } catch (notifErr) {
        console.error("Legal diff error (non-fatal):", notifErr);
      }
    }

    return NextResponse.json(content, { status: 200 });
  } catch (error) {
    console.error("POST /api/admin/content error:", error);
    return NextResponse.json({ error: "Failed to save content" }, { status: 500 });
  }
}
