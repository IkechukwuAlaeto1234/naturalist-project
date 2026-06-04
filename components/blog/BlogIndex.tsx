"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Clock3 } from "lucide-react";

// Format: May 31, 2026, 08:29 AM
function formatDateTime(date: string | Date) {
  const d = new Date(date);
  const dateFormatted = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  
  const timeFormatted = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return `${dateFormatted}, ${timeFormatted}`;
}

function formatDateTimeParts(date: string | Date) {
  const d = new Date(date);
  const dateFormatted = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  
  const timeFormatted = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  return {
    date: dateFormatted,
    time: timeFormatted,
  };
}

export default function BlogIndex() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [pageContent, setPageContent] = useState<Record<string, string>>({});

  const getValue = (key: string, defaultValue: string) => {
    if (Object.keys(pageContent).length === 0) return defaultValue;
    const val = pageContent[key];
    return val !== undefined && val !== null ? val : defaultValue;
  };

  const heroBadge = getValue("heroBadge", "Rituals & Stories");
  const heroHeadline = getValue("heroHeadline", "Our Journal");
  const heroSubtext = getValue("heroSubtext", "Fresh editorial notes from the Naturalist team. Thoughtful ingredients, practical rituals, and a calm reading experience.");
  const heroImage = getValue("heroImage", "");

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/blogs", { cache: "no-store" });
      const data = await res.json();
      setPosts(data || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();

    // Fetch CMS content for blog hero
    fetch("/api/content?key=blog", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : null)
      .then((data) => { if (data?.metadata) setPageContent(data.metadata); })
      .catch(() => {});

    // Client-side query tag check to prevent build-time suspense requirements
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const tagParam = params.get("tag");
      if (tagParam) {
        setSelectedTag(tagParam);
      }
    }

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchPosts();
      }
    };

    const handleFocus = () => fetchPosts();
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) {
        fetchPosts();
      }
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "naturalist-blog-updated") {
        fetchPosts();
      }
    };

    window.addEventListener("focus", handleFocus);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("storage", handleStorage);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("storage", handleStorage);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  // Filter posts based on selected tag
  const filteredPosts = selectedTag
    ? posts.filter((post) => post.tags?.includes(selectedTag))
    : posts;

  const featured = filteredPosts[0];
  const remaining = filteredPosts.slice(1);

  return (
    <div className="bg-white dark:bg-[#0a0d0b] text-foreground flex flex-col w-full pb-32">
      
      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-[#0d1510] flex items-center justify-center" style={{ minHeight: "380px" }}>
        {heroImage ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={heroImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-25 pointer-events-none" />
        ) : (
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="blogPattern" x="0" y="0" width="200" height="200" patternUnits="userSpaceOnUse">
                <path d="M40 100 Q80 20 120 20 Q90 60 40 100Z" fill="#b07e3a" opacity="0.1" />
                <path d="M40 100 Q80 180 120 180 Q90 140 40 100Z" fill="#b07e3a" opacity="0.07" />
                <line x1="40" y1="100" x2="120" y2="100" stroke="#b07e3a" strokeWidth="0.5" opacity="0.12" />
                <path d="M160 40 Q180 80 190 100 Q170 75 160 40Z" fill="#2d4c38" opacity="0.18" />
                <path d="M160 160 Q180 120 190 100 Q170 125 160 160Z" fill="#2d4c38" opacity="0.14" />
                <circle cx="120" cy="100" r="3" fill="#b07e3a" opacity="0.2" />
                <circle cx="40" cy="100" r="1.5" fill="#2d4c38" opacity="0.15" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="#0d1510" />
            <rect width="100%" height="100%" fill="url(#blogPattern)" />
          </svg>
        )}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 70% at 50% 50%, rgba(45,76,56,0.3) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, #0d1510 0%, transparent 30%, transparent 70%, #0d1510 100%)" }} />
        <div className="relative z-10 flex flex-col items-center text-center gap-3 px-6 py-28">
          {heroBadge && (
            <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a]">{heroBadge}</span>
          )}
          {heroHeadline && (
            <h1 className="font-serif font-black text-white leading-none tracking-tight" style={{ fontSize: "clamp(3.5rem, 10vw, 7rem)" }}>
              {heroHeadline}
            </h1>
          )}
          {heroSubtext && (
            <p className="text-sm text-white/40 max-w-md leading-relaxed mt-1">
              {heroSubtext}
            </p>
          )}
        </div>
      </section>

      {/* Main Content */}
      <section className="px-6 sm:px-8 py-20 bg-white dark:bg-[#0a0d0b] transition-colors duration-300">
        <div className="mx-auto max-w-7xl">

          {selectedTag && (
            <div className="mb-8 flex items-center justify-between p-4 rounded-2xl bg-[#2d4c38]/5 border border-[#2d4c38]/10 text-sm font-bold text-[#2d4c38] dark:text-emerald-400 animate-fade-in-up">
              <div className="flex items-center gap-2">
                <span>Showing stories tagged with</span>
                <span className="px-3 py-1 rounded-full bg-[#2d4c38]/10 uppercase tracking-widest text-xs font-black">{selectedTag}</span>
              </div>
              <button
                onClick={() => setSelectedTag(null)}
                className="text-xs uppercase tracking-widest font-black underline hover:text-[#b07e3a] cursor-pointer"
              >
                Clear Filter
              </button>
            </div>
          )}

          {loading ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-[420px] rounded-[28px] border border-border/40 bg-muted/20 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {filteredPosts.map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col overflow-hidden rounded-[28px] border border-border/40 bg-white dark:bg-[#0f1411] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      <img src={post.coverImage} alt={post.coverImageAlt || post.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>

                    <div className="p-6 space-y-5 flex flex-col justify-between flex-1">
                      <div className="space-y-4">
                        <h3 className="font-serif text-2xl font-bold tracking-tight text-[#141f19] dark:text-[#f4f6f4] group-hover:text-[#2d4c38] transition-colors leading-snug">{post.title}</h3>
                        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-3">{post.excerpt}</p>
                        
                        {/* Interactive Clickable Tags after the post */}
                        {post.tags && post.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-1.5">
                            {post.tags.slice(0, 3).map((tag: string) => (
                              <button
                                key={tag}
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setSelectedTag(tag);
                                }}
                                className="inline-flex rounded-full bg-[#2d4c38]/5 hover:bg-[#2d4c38]/10 border border-[#2d4c38]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-[#2d4c38] dark:text-emerald-300 transition-colors cursor-pointer"
                              >
                                {tag}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Bold simplified metadata section separated by divider line */}
                      <div className="flex items-center justify-between gap-3 pt-4 border-t border-border/40 text-xs font-bold text-foreground">
                        {/* Author section */}
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="h-5.5 w-5.5 rounded-full bg-[#2d4c38] text-white flex items-center justify-center font-serif text-[9px] font-black uppercase shadow-sm flex-shrink-0">
                            {post.authorName?.[0]?.toUpperCase() || "N"}
                          </span>
                          <span className="font-bold text-[#2d4c38] dark:text-emerald-400 uppercase tracking-wider text-[10px] truncate">
                            {post.authorName}
                          </span>
                        </div>
                        {/* Exact Published Date */}
                        {(() => {
                          const { date, time } = formatDateTimeParts(post.publishedAt);
                          return (
                            <div className="flex flex-col items-end text-right flex-shrink-0">
                              <span className="font-bold text-muted-foreground text-[10px] uppercase tracking-wider">{date}</span>
                              <span className="text-[9px] opacity-70 font-semibold text-muted-foreground/80 tracking-wide mt-0.5">{time}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

          {posts.length === 0 && !loading && (
            <div className="mt-10 rounded-[28px] border border-dashed border-border/40 p-10 text-center text-sm text-muted-foreground">
              No blog posts have been seeded yet.
            </div>
          )}

          <div className="mt-12 flex justify-center">
            <Link href="/" className="inline-flex items-center gap-2 rounded-full border border-border/60 px-5 py-3 text-xs font-bold uppercase tracking-widest text-foreground transition-colors hover:bg-muted">
              Back to Home <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}