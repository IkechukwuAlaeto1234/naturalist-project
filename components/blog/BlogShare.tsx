"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Link2, Check, X } from "lucide-react";

interface BlogShareProps {
  title: string;
  excerpt?: string;
}

// Social icons served via the /cdn/ proxy — same Cloudinary assets as emails/assets.ts
const CDN_BASE = "/cdn/image/upload";
const SOCIAL_ICONS = {
  x:        `${CDN_BASE}/v1780787292/brand/social_x.png`,
  facebook: `${CDN_BASE}/v1780787296/brand/social_facebook.png`,
  linkedin: `${CDN_BASE}/v1780787294/brand/social_linkedin.png`,
  whatsapp: `${CDN_BASE}/v1780787299/brand/social_whatsapp.png`,
} as const;

// ─── Share Modal ─────────────────────────────────────────────────────────────
interface ShareModalProps {
  title: string;
  excerpt?: string;
  shareUrl: string;
  onClose: () => void;
}

function ShareModal({ title, excerpt, shareUrl, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl  = encodeURIComponent(shareUrl);
  const rawText     = `Read "${title}" on Naturalist Skincare${excerpt ? ` – ${excerpt}` : ""}`;
  const truncated   = rawText.length > 200 ? rawText.slice(0, 197) + "…" : rawText;
  const encodedText = encodeURIComponent(truncated);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* ignore */ }
  }, [shareUrl]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  const platforms = [
    {
      key:   "x"        as const,
      label: "X",
      href:  `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    },
    {
      key:   "facebook" as const,
      label: "Facebook",
      href:  `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`,
    },
    {
      key:   "whatsapp" as const,
      label: "WhatsApp",
      href:  `https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`,
    },
    {
      key:   "linkedin" as const,
      label: "LinkedIn",
      href:  `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&summary=${encodedText}`,
    },
  ];

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-label="Share this article"
    >
      {/* Blurred overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full max-w-sm rounded-[28px] border border-white/10 bg-white dark:bg-[#0f1411] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border/30 dark:border-white/10">
          <div>
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#b07e3a]">
              Spread the Ritual
            </span>
            <h3 className="font-serif text-lg font-bold text-[#141f19] dark:text-[#f4f6f4] mt-0.5 leading-tight">
              Share this Story
            </h3>
          </div>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full border border-border/50 dark:border-white/10 flex items-center justify-center text-muted-foreground hover:text-[#141f19] dark:hover:text-white hover:border-[#b07e3a] transition-all cursor-pointer"
            aria-label="Close share dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Article preview */}
        <div className="px-6 py-4 border-b border-border/20 dark:border-white/5">
          <p className="text-xs font-semibold text-[#141f19] dark:text-[#f4f6f4] line-clamp-2 leading-snug">
            {title}
          </p>
          {excerpt && (
            <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-snug">
              {excerpt}
            </p>
          )}
        </div>

        {/* Platform grid */}
        <div className="grid grid-cols-4 gap-3 px-6 py-5">
          {platforms.map(({ key, label, href }) => (
            <a
              key={key}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-2 group"
              aria-label={`Share on ${label}`}
            >
              <span className="h-14 w-14 rounded-2xl border border-border/50 dark:border-white/10 bg-white dark:bg-[#0c100e] flex items-center justify-center group-hover:border-[#b07e3a] group-hover:bg-[#b07e3a]/5 transition-all">
                <Image
                  src={SOCIAL_ICONS[key]}
                  alt={label}
                  width={28}
                  height={28}
                  className="object-contain"
                  unoptimized
                />
              </span>
              <span className="text-[10px] text-muted-foreground group-hover:text-[#b07e3a] transition-colors text-center leading-tight font-medium">
                {label}
              </span>
            </a>
          ))}
        </div>

        {/* Copy link — brand font, no monospace */}
        <div className="px-6 pb-6">
          <div className="flex items-center gap-2 h-11 rounded-xl border border-border/50 dark:border-white/10 bg-[#f7f5f0] dark:bg-[#0c100e] overflow-hidden pr-1">
            <span className="flex-1 px-3 text-[11px] text-muted-foreground truncate select-all">
              {shareUrl}
            </span>
            <button
              onClick={handleCopy}
              className={`h-9 shrink-0 rounded-lg px-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                copied
                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                  : "bg-[#141f19] dark:bg-[#b07e3a] text-white hover:opacity-90"
              }`}
              aria-label="Copy link"
            >
              {copied ? (
                <><Check className="h-3 w-3" /> Copied</>
              ) : (
                <><Link2 className="h-3 w-3" /> Copy</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main BlogShare bar ───────────────────────────────────────────────────────
// The bar is simplified: the modal handles all platform sharing.
// Copy Link is kept beside the Share button for quick one-tap access.
export default function BlogShare({ title, excerpt }: BlogShareProps) {
  const [copied,    setCopied]    = useState(false);
  const [shareUrl,  setShareUrl]  = useState("");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") setShareUrl(window.location.href);
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch { /* ignore */ }
  };

  return (
    <>
      <div className="p-6 rounded-[28px] border border-border/40 bg-white dark:bg-[#0f1411] shadow-sm flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left gap-4 transition-colors duration-300">
        <div>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#b07e3a]">
            Spread the Ritual
          </span>
          <h3 className="font-serif text-lg font-bold text-[#141f19] dark:text-[#f4f6f4] mt-0.5">
            Share this Story
          </h3>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Copy Link — quick-access without opening modal */}
          <button
            onClick={handleCopyLink}
            className={`h-10 w-[130px] rounded-xl border flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex-shrink-0 ${
              copied
                ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
                : "bg-white dark:bg-[#0c100e] border-border/60 dark:border-white/10 hover:border-[#b07e3a] text-muted-foreground hover:text-[#b07e3a] hover:bg-[#b07e3a]/5"
            }`}
            aria-label="Copy article link"
          >
            {copied ? (
              <><Check className="h-3.5 w-3.5 flex-shrink-0" /> Copied!</>
            ) : (
              <><Link2 className="h-3.5 w-3.5 flex-shrink-0" /> Copy Link</>
            )}
          </button>

          {/* Share — opens custom modal. Uses Material Symbols Rounded "ios_share" icon */}
          <button
            onClick={() => setShowModal(true)}
            className="h-10 px-4 rounded-xl bg-[#141f19] dark:bg-[#b07e3a] text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer flex-shrink-0"
            aria-label="Open share dialog"
          >
            <span className="ms ms-fill" style={{ fontSize: "18px" }} aria-hidden="true">
              ios_share
            </span>
            Share
          </button>
        </div>
      </div>

      {showModal && (
        <ShareModal
          title={title}
          excerpt={excerpt}
          shareUrl={shareUrl}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
