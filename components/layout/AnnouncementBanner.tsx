"use client";

import React, { useState, useEffect } from "react";

interface Announcement {
  _id: string;
  text: string;
  ctaLabel?: string;
  ctaUrl?: string;
  type: "promo" | "info" | "alert" | "free-shipping";
}

const DEFAULT_MESSAGES: Announcement[] = [
  { _id: "d1", text: "🌿 Free worldwide shipping on orders over $75", type: "free-shipping" },
  { _id: "d2", text: "✨ Crafted from 100% wild-harvested botanicals — pure natural efficacy", type: "info" },
  { _id: "d3", text: "🍃 New arrivals now live — The Botanical Serum Collection", type: "promo", ctaLabel: "Explore Now", ctaUrl: "/p/shop" },
  { _id: "d4", text: "🌍 Naturalist ships to 40+ countries worldwide", type: "info" },
  { _id: "d5", text: "🎁 Buy any 3 products and receive 15% off — Limited time offer", type: "promo", ctaLabel: "Shop Now", ctaUrl: "/p/shop" },
];

const TYPE_COLORS: Record<string, string> = {
  promo:           "#d4a362",
  info:            "rgba(244,246,244,0.82)",
  alert:           "#f87171",
  "free-shipping": "#6ee7b7",
};

export default function AnnouncementBanner() {
  const [messages, setMessages] = useState<Announcement[]>(DEFAULT_MESSAGES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isHoveredOrTouched, setIsHoveredOrTouched] = useState(false);

  /* Fetch live announcements */
  useEffect(() => {
    fetch("/api/announcements", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) setMessages(data);
      })
      .catch(() => {});
  }, []);

  const paused = isPaused || isHoveredOrTouched;

  /* Auto-play logic: change slide every 6 seconds unless paused */
  useEffect(() => {
    if (paused || messages.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % messages.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [paused, messages.length]);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + messages.length) % messages.length);
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % messages.length);
  };

  const togglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPaused((p) => !p);
  };

  return (
    <div
      role="banner"
      aria-label="Announcements"
      className="relative w-full select-none"
      style={{
        height: "52px",
        background: "linear-gradient(90deg, #080f0a 0%, #0c1510 40%, #0c1510 60%, #080f0a 100%)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        overflow: "hidden",
      }}
      onMouseEnter={() => setIsHoveredOrTouched(true)}
      onMouseLeave={() => setIsHoveredOrTouched(false)}
      onTouchStart={() => setIsHoveredOrTouched(true)}
      onTouchEnd={() => setIsHoveredOrTouched(false)}
    >
      {/* Subtle shimmer accent line */}
      <div
        className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, rgba(176,126,58,0.5) 50%, transparent)" }}
      />

      {/* Left Navigation Button */}
      <button
        onClick={handlePrev}
        aria-label="Previous announcement"
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 hover:border-white/25 bg-white/[0.04] hover:bg-white/[0.09] text-white/40 hover:text-white/80 transition-all duration-200 cursor-pointer"
      >
        <span className="ms" style={{ fontSize: 14 }}>
          chevron_left
        </span>
      </button>

      {/* Slider Container */}
      <div className="h-full w-full overflow-hidden flex items-center justify-center">
        <div
          className="flex h-full w-full transition-transform duration-500 ease-in-out"
          style={{
            transform: `translateX(-${currentIndex * 100}%)`,
          }}
        >
          {messages.map((msg) => (
            <div
              key={msg._id}
              className="w-full h-full flex-shrink-0 flex items-center justify-center px-16 text-center whitespace-nowrap"
            >
              <span
                className="inline-flex items-center gap-3 text-[13px] font-medium tracking-wide leading-none"
                style={{ color: TYPE_COLORS[msg.type] ?? TYPE_COLORS.info }}
              >
                {msg.text}
                {msg.ctaLabel && msg.ctaUrl && (
                  <a
                    href={msg.ctaUrl}
                    className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-opacity hover:opacity-70"
                    style={{
                      background: "rgba(176,126,58,0.18)",
                      border: "1px solid rgba(176,126,58,0.45)",
                      color: "#d4a362",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {msg.ctaLabel}
                    <span className="ms" style={{ fontSize: 11 }}>arrow_forward</span>
                  </a>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Right Controls Container */}
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex items-center gap-2">
        {/* Play/Pause Button */}
        <button
          onClick={togglePause}
          aria-label={paused ? "Resume announcements" : "Pause announcements"}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 hover:border-white/25 bg-white/[0.04] hover:bg-white/[0.09] text-white/40 hover:text-white/80 transition-all duration-200 cursor-pointer"
        >
          <span className="ms" style={{ fontSize: 14 }}>
            {isPaused ? "play_arrow" : "pause"}
          </span>
        </button>

        {/* Right Navigation Button */}
        <button
          onClick={handleNext}
          aria-label="Next announcement"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 hover:border-white/25 bg-white/[0.04] hover:bg-white/[0.09] text-white/40 hover:text-white/80 transition-all duration-200 cursor-pointer"
        >
          <span className="ms" style={{ fontSize: 14 }}>
            chevron_right
          </span>
        </button>
      </div>
    </div>
  );
}
