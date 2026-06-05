import React from "react";
import Link from "next/link";
import { Download, History } from "lucide-react";

interface Section {
  heading: string;
  body: string | string[];
}

interface LegalPageProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  lastUpdated: string;
  sections: Section[];
  patternId: string;
  versions?: any[];
  slug?: string;
  isAdmin?: boolean;
  onDownloadPDF?: () => void;
  disclaimerUrl?: string;
}

// Returns the single most-recent archived version (the one immediately before current)
function getPreviousVersion(versions?: any[]): any | null {
  if (!versions || versions.length === 0) return null;
  // versions array is chronological (oldest first); the last item is the most recent archived snapshot
  return versions[versions.length - 1];
}

export default function LegalPageShell({
  eyebrow,
  title,
  subtitle,
  lastUpdated,
  sections,
  patternId,
  versions,
  slug,
  isAdmin,
  onDownloadPDF,
  disclaimerUrl,
}: LegalPageProps) {
  const previousVersion = getPreviousVersion(versions);
  return (
    <div className="flex flex-col w-full">

      {/* Hero */}
      <section
        className="relative w-full overflow-hidden bg-[#0d1510] flex items-center justify-center"
        style={{ minHeight: "280px" }}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <pattern id={patternId} x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <circle cx="50" cy="50" r="22" fill="none" stroke="#2d4c38" strokeWidth="0.5" opacity="0.13" />
              <circle cx="50" cy="50" r="2.5" fill="#b07e3a" opacity="0.18" />
              <path d="M10 50 Q30 15 50 15 Q35 35 10 50Z" fill="#2d4c38" opacity="0.13" />
              <path d="M90 50 Q70 85 50 85 Q65 65 90 50Z" fill="#b07e3a" opacity="0.09" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="#0d1510" />
          <rect width="100%" height="100%" fill={`url(#${patternId})`} />
        </svg>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 50% 70% at 50% 50%, rgba(45,76,56,0.28) 0%, transparent 70%)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, #0d1510 0%, transparent 30%, transparent 70%, #0d1510 100%)" }}
        />
        <div className="relative z-10 flex flex-col items-center text-center gap-3 px-6 py-20">
          <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a]">{eyebrow}</span>
          <h1
            className="font-serif font-black text-white leading-none tracking-tight"
            style={{ fontSize: "clamp(2.5rem, 7vw, 5.5rem)" }}
          >
            {title}
          </h1>
          <p className="text-sm text-white/40 max-w-xs leading-relaxed mt-1">{subtitle}</p>
        </div>
      </section>

      {/* Body */}
      <section className="w-full bg-[#fcfcfb] dark:bg-[#0a0d0b] py-20 px-6 sm:px-8 transition-colors duration-300">
        <div className="mx-auto max-w-2xl">

          <div className="mb-10 flex flex-row items-center justify-between gap-4 border-b border-border/40 pb-6">
            {/* LHS: Effective date */}
            <span className="w-fit inline-flex items-center rounded-full border border-[#b07e3a]/20 bg-[#b07e3a]/5 dark:bg-[#b07e3a]/10 px-3.5 py-1.5 text-xs font-bold text-[#b07e3a]">
              Effective {lastUpdated}
            </span>

            {/* RHS: Previous Version link (single — immediate predecessor only) */}
            {slug && previousVersion && (
              <Link
                href={`/p/${slug}/archive/${previousVersion._id}`}
                className="text-xs font-bold text-[#b07e3a] underline underline-offset-2 hover:text-[#d4a362] transition-colors whitespace-nowrap"
              >
                Previous Version
              </Link>
            )}
          </div>

          {/* Archived banner — only shown on archived version pages */}
          {disclaimerUrl && (
            <div className="mb-10 bg-[#2e3330] dark:bg-[#1a1f1c] text-white px-8 py-5 rounded-2xl text-base font-semibold border border-white/5 text-center leading-relaxed shadow-sm">
              This document has been replaced by a{" "}
              <Link href={disclaimerUrl} className="underline underline-offset-2 font-bold text-[#b07e3a] hover:text-[#d4a362] transition-colors">
                newer version
              </Link>
              , and is available for archival purposes
            </div>
          )}

          {/* Sections */}
          <div className="flex flex-col gap-12">
            {sections.map((section, i) => (
              <div key={i} className="flex flex-col gap-3">
                <h2 className="font-serif text-xl font-bold text-foreground tracking-tight">{section.heading}</h2>
                {Array.isArray(section.body) ? (
                  <ul className="flex flex-col gap-2">
                    {section.body.map((item, j) => (
                      <li key={j} className="flex gap-3 text-base text-muted-foreground leading-relaxed">
                        <span className="mt-[6px] h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#b07e3a]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-base text-muted-foreground leading-relaxed">{section.body}</p>
                )}
              </div>
            ))}
          </div>

          {/* Footer note + Contact Us */}
          <div className="mt-14 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              Questions about this policy? We're happy to explain anything in plain language.
            </p>
            <Link
              href="/contact"
              className="flex-shrink-0 inline-flex h-11 items-center gap-2 rounded-full bg-[#2d4c38] px-7 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#3a6349] transition-all shadow-sm"
            >
              Contact Us
            </Link>
          </div>

          {/* Download PDF CTA — sits below Contact Us section */}
          {onDownloadPDF && (
            <div className="mt-10 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-foreground">Download a copy</p>
                <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                  Save a PDF of this document for your records.
                </p>
              </div>
              <button
                onClick={onDownloadPDF}
                className="flex-shrink-0 flex h-11 items-center gap-2 rounded-full border border-border/80 bg-background/50 hover:bg-muted/80 px-6 text-xs font-bold uppercase tracking-wider text-foreground transition-all shadow-sm cursor-pointer hover:border-[#b07e3a]/40"
              >
                <Download className="h-3.5 w-3.5 text-[#b07e3a]" />
                Download PDF
              </button>
            </div>
          )}

        </div>
      </section>

    </div>
  );
}
