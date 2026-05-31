"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarDays, Clock3, MessageCircle } from "lucide-react";

function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export default function BlogIndex() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  const featured = posts[0];
  const remaining = posts.slice(1);

  return (
    <div className="bg-white dark:bg-[#0a0d0b] text-foreground flex flex-col w-full pb-32">
      
      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-[#0d1510] flex items-center justify-center" style={{ minHeight: "380px" }}>
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
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 70% at 50% 50%, rgba(45,76,56,0.3) 0%, transparent 70%)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(to bottom, #0d1510 0%, transparent 30%, transparent 70%, #0d1510 100%)" }} />
        <div className="relative z-10 flex flex-col items-center text-center gap-3 px-6 py-28">
          <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-[#b07e3a]">Rituals & Stories</span>
          <h1 className="font-serif font-black text-white leading-none tracking-tight" style={{ fontSize: "clamp(3.5rem, 10vw, 7rem)" }}>
            Our Journal
          </h1>
          <p className="text-sm text-white/40 max-w-md leading-relaxed mt-1">
            Fresh editorial notes from the Naturalist team. Thoughtful ingredients, practical rituals, and a calm reading experience.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="px-6 sm:px-8 py-20 bg-white dark:bg-[#0a0d0b] transition-colors duration-300">
        <div className="mx-auto max-w-7xl">

          {loading ? (
            <div className="mt-10 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {[...Array(3)].map((_, index) => (
                <div key={index} className="h-[420px] rounded-[28px] border border-border/40 bg-muted/20 animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {featured && (
                <Link href={`/blog/${featured.slug}`} className="mt-10 grid overflow-hidden rounded-[32px] border border-border/40 bg-[#f8f5ef] dark:bg-[#111a14] shadow-[0_24px_70px_rgba(20,31,25,0.08)] transition-transform duration-300 hover:-translate-y-1 md:grid-cols-12">
                  <div className="relative md:col-span-6 min-h-[280px]">
                    <img src={featured.coverImage} alt={featured.coverImageAlt || featured.title} className="absolute inset-0 h-full w-full object-cover" />
                  </div>

                  <div className="md:col-span-6 p-7 sm:p-10 flex flex-col justify-between gap-6">
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {featured.tags?.slice(0, 3).map((tag: string) => (
                          <span key={tag} className="inline-flex items-center rounded-full bg-white/70 dark:bg-white/5 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#2d4c38] dark:text-emerald-300">{tag}</span>
                        ))}
                      </div>

                      <h2 className="font-serif text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-[#141f19] dark:text-[#f4f6f4]">{featured.title}</h2>
                      <p className="text-sm sm:text-base leading-relaxed text-muted-foreground">{featured.excerpt}</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                      <span className="inline-flex items-center gap-2">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {formatDate(featured.publishedAt)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Clock3 className="h-3.5 w-3.5" />
                        {featured.readTime}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <MessageCircle className="h-3.5 w-3.5" />
                        {featured.commentsCount || 0} comments
                      </span>
                    </div>
                  </div>
                </Link>
              )}

              <div className="mt-12 grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {remaining.map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`} className="group overflow-hidden rounded-[28px] border border-border/40 bg-white dark:bg-[#0f1411] shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      <img src={post.coverImage} alt={post.coverImageAlt || post.title} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
                    </div>

                    <div className="p-6 space-y-4">
                      <div className="flex flex-wrap gap-2">
                        {post.tags?.slice(0, 2).map((tag: string) => (
                          <span key={tag} className="inline-flex rounded-full bg-[#2d4c38]/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.24em] text-[#2d4c38] dark:text-emerald-300">{tag}</span>
                        ))}
                      </div>

                      <h3 className="font-serif text-2xl font-bold tracking-tight text-[#141f19] dark:text-[#f4f6f4] group-hover:text-[#2d4c38] transition-colors">{post.title}</h3>
                      <p className="text-sm leading-relaxed text-muted-foreground">{post.excerpt}</p>

                      <div className="flex items-center justify-between gap-4 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                        <span>{post.authorName}</span>
                        <span className="inline-flex items-center gap-2"><MessageCircle className="h-3.5 w-3.5" />{post.commentsCount || 0} comments</span>
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