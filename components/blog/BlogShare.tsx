"use client";

import React, { useState, useEffect } from "react";
import { Link2, Check } from "lucide-react";

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

export default function BlogShare({ title, excerpt }: BlogShareProps) {
  const [copied, setCopied] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== "undefined") {
      setShareUrl(window.location.href);
    }
  }, []);

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(`Read "${title}" on Naturalist Skincare - ${excerpt || ""}`);

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

      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
        {/* Twitter / X */}
        <a
          href={`https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`}
          target="_blank"
          rel="noopener noreferrer"
          className="relative h-10 w-10 rounded-xl bg-white dark:bg-[#0c100e] border border-border/60 dark:border-white/10 hover:border-[#b07e3a] hover:text-[#b07e3a] flex items-center justify-center text-muted-foreground hover:bg-[#b07e3a]/5 transition-all"
          data-tooltip="Share on X"
        >
          <XIcon />
        </a>

        {/* Facebook */}
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="relative h-10 w-10 rounded-xl bg-white dark:bg-[#0c100e] border border-border/60 dark:border-white/10 hover:border-[#b07e3a] hover:text-[#b07e3a] flex items-center justify-center text-muted-foreground hover:bg-[#b07e3a]/5 transition-all"
          data-tooltip="Share on Facebook"
        >
          <FacebookIcon />
        </a>

        {/* LinkedIn */}
        <a
          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
          className="relative h-10 w-10 rounded-xl bg-white dark:bg-[#0c100e] border border-border/60 dark:border-white/10 hover:border-[#b07e3a] hover:text-[#b07e3a] flex items-center justify-center text-muted-foreground hover:bg-[#b07e3a]/5 transition-all"
          data-tooltip="Share on LinkedIn"
        >
          <LinkedinIcon />
        </a>

        {/* Copy Link */}
        <button
          onClick={handleCopyLink}
          className={`relative h-10 px-4 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
            copied
              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"
              : "bg-white dark:bg-[#0c100e] border-border/60 dark:border-white/10 hover:border-[#b07e3a] text-muted-foreground hover:text-[#b07e3a] hover:bg-[#b07e3a]/5"
          }`}
          data-tooltip="Copy Article Link"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" /> Copied!
            </>
          ) : (
            <>
              <Link2 className="h-3.5 w-3.5" /> Copy Link
            </>
          )}
        </button>

      </div>
    </div>
  );
}
