"use client";

import React, { useState, useEffect } from "react";
import { Link2, Check, Share2 } from "lucide-react";

interface BlogShareProps {
  title: string;
  excerpt?: string;
}

// Inline SVGs for version-safe premium social icons
const XIcon = () => (
  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const FacebookIcon = () => (
  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const LinkedinIcon = () => (
  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0z" />
  </svg>
);

const WhatsappIcon = () => (
  <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.859 0c3.166.001 6.141 1.233 8.378 3.471 2.236 2.237 3.466 5.21 3.463 8.377-.006 6.537-5.332 11.86-11.86 11.86-.003 0-.005 0-.007 0-2.008-.001-3.98-.519-5.733-1.503L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.45 5.535 0 10.04-4.502 10.046-10.042.003-2.684-1.038-5.207-2.93-7.101C16.539 1.568 14.02 .526 11.863.526c-5.54 0-10.047 4.505-10.052 10.045-.001 1.84.482 3.633 1.4 5.2l-.926 3.38 3.472-.91c1.557.848 3.097 1.258 4.704 1.259h.001zm11.365-7.4c-.08-.13-.29-.21-.61-.37-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.71.16-.21.32-.82 1.04-1.01 1.25-.19.21-.38.24-.7.08-.32-.16-1.35-.5-2.58-1.59-.95-.85-1.6-1.9-1.78-2.22-.19-.32-.02-.49.14-.65.15-.15.32-.37.48-.56.16-.18.21-.31.32-.51.11-.2.05-.38-.03-.54-.08-.16-.71-1.72-.97-2.36-.26-.63-.52-.55-.71-.55-.18-.01-.39-.01-.61-.01-.22 0-.58.08-.88.4-.3.32-1.15 1.12-1.15 2.73s1.17 3.17 1.33 3.38c.16.21 2.3 3.52 5.58 4.94.78.34 1.39.54 1.86.69.78.25 1.49.21 2.05.13.62-.09 1.89-.77 2.15-1.51.26-.74.26-1.37.18-1.51z" />
  </svg>
);

export default function BlogShare({ title, excerpt }: BlogShareProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const [supportShare, setSupportShare] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        setSupportShare(true);
      }
    }
  }, []);

  const encodedUrl = encodeURIComponent(shareUrl);
  const rawText = `Read "${title}" on Naturalist Skincare${excerpt ? ` - ${excerpt}` : ""}`;
  const truncatedText = rawText.length > 200 ? rawText.slice(0, 197) + "..." : rawText;
  const encodedText = encodeURIComponent(truncatedText);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy URL:", err);
    }
  };

  const handleWebShare = async () => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({
          title: title,
          text: excerpt || `Read "${title}" on Naturalist Skincare`,
          url: shareUrl,
        });
      } catch (err) {
        console.error("Error invoking Web Share:", err);
      }
    }
  };

  return (
    <div className="p-6 rounded-[28px] border border-border/40 bg-white dark:bg-[#0f1411] shadow-sm flex flex-col items-center text-center sm:flex-row sm:items-center sm:justify-between sm:text-left gap-4 transition-colors duration-300">
      <div>
        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#b07e3a]">Spread the Ritual</span>
        <h3 className="font-serif text-lg font-bold text-[#141f19] dark:text-[#f4f6f4] mt-0.5">Share this Story</h3>
      </div>

      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
        {/* Social Icons row grouped together */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Twitter / X */}
          <a
            href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="relative h-10 w-10 rounded-xl bg-white dark:bg-[#0c100e] border border-border/60 dark:border-white/10 hover:border-[#b07e3a] hover:text-[#b07e3a] flex items-center justify-center text-muted-foreground hover:bg-[#b07e3a]/5 transition-all flex-shrink-0"
            data-tooltip="Share on X"
          >
            <XIcon />
          </a>

          {/* Facebook */}
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="relative h-10 w-10 rounded-xl bg-white dark:bg-[#0c100e] border border-border/60 dark:border-white/10 hover:border-[#b07e3a] hover:text-[#b07e3a] flex items-center justify-center text-muted-foreground hover:bg-[#b07e3a]/5 transition-all flex-shrink-0"
            data-tooltip="Share on Facebook"
          >
            <FacebookIcon />
          </a>

          {/* LinkedIn */}
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="relative h-10 w-10 rounded-xl bg-white dark:bg-[#0c100e] border border-border/60 dark:border-white/10 hover:border-[#b07e3a] hover:text-[#b07e3a] flex items-center justify-center text-muted-foreground hover:bg-[#b07e3a]/5 transition-all flex-shrink-0"
            data-tooltip="Share on LinkedIn"
          >
            <LinkedinIcon />
          </a>

          {/* WhatsApp */}
          <a
            href={`https://api.whatsapp.com/send?text=${encodedText}%20${encodedUrl}`}
            target="_blank"
            rel="noopener noreferrer"
            className="relative h-10 w-10 rounded-xl bg-white dark:bg-[#0c100e] border border-border/60 dark:border-white/10 hover:border-[#b07e3a] hover:text-[#b07e3a] flex items-center justify-center text-muted-foreground hover:bg-[#b07e3a]/5 transition-all flex-shrink-0"
            data-tooltip="Share on WhatsApp"
          >
            <WhatsappIcon />
          </a>
        </div>

        {/* Copy Link - w-[130px] fixed width to guarantee no layout jumps */}
        <button
          onClick={handleCopyLink}
          className={`relative h-10 w-[130px] rounded-xl border flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex-shrink-0 ${
            copied
              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
              : "bg-white dark:bg-[#0c100e] border-border/60 dark:border-white/10 hover:border-[#b07e3a] text-muted-foreground hover:text-[#b07e3a] hover:bg-[#b07e3a]/5"
          }`}
          data-tooltip="Copy Article Link"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 flex-shrink-0" /> Copied!
            </>
          ) : (
            <>
              <Link2 className="h-3.5 w-3.5 flex-shrink-0" /> Copy Link
            </>
          )}
        </button>

        {supportShare && (
          <button
            onClick={handleWebShare}
            className="relative h-10 w-10 rounded-xl bg-white dark:bg-[#0c100e] border border-border/60 dark:border-white/10 hover:border-[#b07e3a] hover:text-[#b07e3a] hover:bg-[#b07e3a]/5 flex items-center justify-center text-muted-foreground transition-all flex-shrink-0 cursor-pointer"
            data-tooltip="Share via System"
          >
            <Share2 className="h-4 w-4" />
          </button>
        )}

      </div>
    </div>
  );
}
