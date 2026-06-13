import { Metadata } from "next";

import { notFound } from "next/navigation";
import Script from "next/script";
import { CalendarDays, ArrowLeft } from "lucide-react";
import { connectToDatabase } from "@/lib/db";
import { Blog } from "@/models/Blog";
import BlogShare from "@/components/blog/BlogShare";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://naturalist-project.onrender.com";

// OG images must be absolute URLs. coverImage is stored as /cdn/... (relative)
// after proxyCloudinaryUrl(), so we resolve it here before setting OG tags.
function resolveAbsoluteUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${SITE_URL}${url.startsWith("/") ? url : "/" + url}`;
}

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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  try {
    const { slug } = await params;
    await connectToDatabase();
    const post = await Blog.findOne({ slug }).lean();

    if (!post) {
      return {
        title: "Blog Post Not Found | Naturalist",
      };
    }

    const pageUrl = `${SITE_URL}/blog/${post.slug}`;
    const coverImageUrl = resolveAbsoluteUrl(post.coverImage ?? "");
    const ogImage = coverImageUrl
      ? [{ url: coverImageUrl, width: 1200, height: 630, alt: post.coverImageAlt || post.title }]
      : [];

    // Guard publishedAt — new Date(undefined) throws "Invalid time value" which
    // Next.js silently catches, wiping ALL metadata and falling back to layout.tsx.
    const publishedTime = post.publishedAt
      ? new Date(post.publishedAt).toISOString()
      : undefined;

    return {
      title: `${post.title} | Naturalist Blog`,
      description: post.excerpt ?? undefined,
      alternates: {
        canonical: pageUrl,
      },
      openGraph: {
        title: post.title,
        description: post.excerpt ?? undefined,
        url: pageUrl,
        siteName: "Naturalist",
        type: "article",
        ...(publishedTime ? { publishedTime } : {}),
        ...(post.authorName ? { authors: [post.authorName] } : {}),
        ...(post.tags?.length ? { tags: post.tags } : {}),
        images: ogImage,
      },
      twitter: {
        card: "summary_large_image",
        title: post.title,
        description: post.excerpt ?? undefined,
        images: ogImage.map((img) => img.url),
      },
    };
  } catch (err) {
    // Log the real error so it shows up in Render logs, then return a safe fallback
    // instead of letting Next.js silently wipe metadata to layout defaults.
    console.error("[generateMetadata] blog/[slug] failed:", err);
    return {
      title: "Naturalist Blog",
      description: "Premium organic skincare insights, guides and rituals.",
    };
  }
}

function renderSectionBody(text: string) {
  if (!text) return null;
  const blocks = text.split(/\n\n+/);
  return (
    <div className="space-y-4">
      {blocks.map((block, bIdx) => {
        const lines = block.split("\n");
        const isList = lines.length > 0 && lines.every((line) => {
          const trimmed = line.trim();
          return trimmed.startsWith("-") || trimmed.startsWith("*") || trimmed.startsWith("•");
        });
        if (isList) {
          return (
            <ul key={bIdx} className="list-disc pl-6 space-y-2 text-sm sm:text-base leading-8 text-muted-foreground">
              {lines.map((line, lIdx) => {
                const cleanLine = line.trim().replace(/^[-*•]\s*/, "");
                return <li key={lIdx}>{cleanLine}</li>;
              })}
            </ul>
          );
        }
        return (
          <p key={bIdx} className="text-sm sm:text-base leading-8 text-muted-foreground whitespace-pre-wrap">
            {block}
          </p>
        );
      })}
    </div>
  );
}

export default async function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  await connectToDatabase();

  const post: any = await Blog.findOne({ slug }).lean();
  if (!post) notFound();

  const publishedAt = formatDateTime(post.publishedAt);
  const pageUrl = `${SITE_URL}/blog/${post.slug}`;
  const coverImageUrl = resolveAbsoluteUrl(post.coverImage);

  // JSON-LD structured data — parsed by Google, Bing, and rich-preview crawlers
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    image: coverImageUrl,
    url: pageUrl,
    datePublished: new Date(post.publishedAt).toISOString(),
    dateModified: post.updatedAt ? new Date(post.updatedAt).toISOString() : new Date(post.publishedAt).toISOString(),
    author: {
      "@type": "Person",
      name: post.authorName,
      jobTitle: post.authorRole || "Naturalist Writer",
    },
    publisher: {
      "@type": "Organization",
      name: "Naturalist",
      url: SITE_URL,
    },
    keywords: post.tags?.join(", "),
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": pageUrl,
    },
  };

  return (
    <div className="bg-white dark:bg-[#0a0d0b] text-foreground transition-colors duration-300">
      <Script
        id={`jsonld-blog-${post.slug}`}
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-7xl px-6 sm:px-8 py-10 sm:py-14 pb-32">
        <div className="mx-auto max-w-4xl">
          <a
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
            Back to Blog
          </a>

          <header className="mt-5 text-center space-y-6">
            <div className="flex flex-wrap justify-center gap-2">
              {post.tags?.map((tag: string) => (
                <span key={tag} className="inline-flex items-center rounded-full bg-[#b07e3a]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-[#b07e3a]">
                  {tag}
                </span>
              ))}
            </div>

            <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[0.95] text-[#2d4c38] dark:text-emerald-400">
              {post.title}
            </h1>

            <p className="mx-auto max-w-2xl text-sm sm:text-base leading-relaxed text-muted-foreground">
              {post.excerpt}
            </p>

            {/* Upgraded Premium Pill-Style Metadata Section */}
            <div className="flex flex-wrap justify-center items-center gap-3 pt-3">
              {/* Author Pill */}
              <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-[#2d4c38]/5 dark:bg-emerald-500/5 border border-[#2d4c38]/10 dark:border-emerald-500/10 text-xs font-bold text-[#2d4c38] dark:text-emerald-400">
                <span className="h-5 w-5 rounded-full bg-[#2d4c38] dark:bg-[#2d4c38] text-white flex items-center justify-center font-serif text-[10px] font-black uppercase shadow-sm flex-shrink-0">
                  {post.authorName?.[0]?.toUpperCase() || "N"}
                </span>
                <span className="font-bold">{post.authorName}</span>
              </div>

              {/* Date Pill */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white dark:bg-[#0c100e] border border-border/60 dark:border-white/10 text-xs font-bold text-muted-foreground">
                <CalendarDays className="h-3.5 w-3.5 text-[#b07e3a]" />
                <span className="font-bold">{publishedAt}</span>
              </div>
            </div>
          </header>

          {/* Cover Image Semantic Figure Wrap */}
          <figure className="mt-10 overflow-hidden rounded-[32px] border border-border/40 bg-[#f8f5ef] dark:bg-[#111a14] shadow-[0_24px_70px_rgba(20,31,25,0.08)]">
            <div className="relative aspect-[16/9]">
              <img
                src={post.coverImage}
                alt={post.coverImageAlt || post.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            </div>
            <figcaption className="px-6 py-4 bg-[#fcfbfa] dark:bg-[#0f1411] border-t border-border/40 text-[10px] sm:text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>Cover: {post.coverImageAlt || post.title}</span>
              <span className="text-[#b07e3a]">Botanical Editorial</span>
            </figcaption>
          </figure>

          <div className="mt-12 grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.8fr)]">
            <div className="space-y-10">
              {post.sections?.map((section: any, index: number) => (
                <section key={`${section.heading || index}`} className="space-y-5">
                  {section.heading && (
                    <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#141f19] dark:text-[#f4f6f4]">
                      {section.heading}
                    </h2>
                  )}
                  {renderSectionBody(section.body)}
                  {section.image && (
                    <figure className="overflow-hidden rounded-[28px] border border-border/40 bg-muted shadow-sm">
                      <img
                        src={section.image}
                        alt={section.imageAlt || section.heading || post.title}
                        className="h-full w-full object-cover"
                      />
                      {section.imageAlt && (
                        <figcaption className="px-5 py-3.5 bg-white dark:bg-[#0c100e] border-t border-border/40 text-[10px] font-semibold tracking-wider text-muted-foreground">
                          {section.imageAlt}
                        </figcaption>
                      )}
                    </figure>
                  )}
                </section>
              ))}

              {/* Custom Social Share Section (Comments removed entirely) */}
              <div className="pt-6">
                <BlogShare title={post.title} excerpt={post.excerpt} />
              </div>
            </div>

            <aside className="space-y-6 lg:sticky lg:top-24 self-start">
              <div className="rounded-[28px] border border-border/40 bg-white dark:bg-[#0f1411] p-6 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">About the Writer</p>
                <div className="mt-4 flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2d4c38]/10 text-[#2d4c38] dark:text-emerald-400 font-black font-serif text-xl flex-shrink-0">
                    {post.authorName?.[0]?.toUpperCase() || "N"}
                  </div>
                  <div>
                    <p className="text-base font-bold text-foreground">{post.authorName}</p>
                    <p className="text-xs text-muted-foreground">{post.authorRole || "Naturalist Writer"}</p>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  Curated editorial stories, ingredient spotlights, and ritual guidance for readers who want calm, modern skincare direction.
                </p>
              </div>

              <div className="rounded-[28px] border border-border/40 bg-white dark:bg-[#0f1411] p-6 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground border-b border-border/10 pb-3">Article Details</p>
                <div className="mt-4 space-y-4">
                  <div className="flex flex-col gap-1.5 border-b border-border/10 pb-3.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Published</span>
                    <span className="text-sm font-black text-[#2d4c38] dark:text-emerald-400">{publishedAt}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Writer Role</span>
                    <span className="text-xs font-black text-foreground">{post.authorRole || "Naturalist Editorial Writer"}</span>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </article>
    </div>
  );
}