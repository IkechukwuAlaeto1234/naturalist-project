"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FileText,
  Users,
  Mail,
  Inbox,
  Image as ImageIcon,
  LogOut,
  Menu,
  X,
  Lock,
  Loader2,
  ChevronRight,
  ShieldCheck,
  LayoutPanelTop,
  Boxes,
  ExternalLink,
  ChevronDown
} from "lucide-react";

const ADMIN_NAV_ITEMS = [
  { id: "orders", label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { id: "products", label: "Products", href: "/admin/products", icon: Package },
  { id: "bundles", label: "Bundles", href: "/admin/bundles", icon: Boxes },
  { id: "pages", label: "Pages", href: "/admin/pages", icon: LayoutPanelTop },
  { id: "blog", label: "Blog", href: "/admin/blog", icon: FileText },
  { id: "users", label: "Users", href: "/admin/users", icon: Users },
  { id: "newsletter", label: "Newsletter", href: "/admin/newsletter", icon: Mail },
  { id: "contacts", label: "Inquiries", href: "/admin/contacts", icon: Inbox },
  { id: "cdn", label: "CDN", href: "/admin/cdn", icon: ImageIcon },
];

type AdminSessionUser = {
  role?: string | null;
};

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [pagesDropdownOpen, setPagesDropdownOpen] = useState(false);
  const [customPages, setCustomPages] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const pagesDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    fetch("/api/admin/custom-pages", { cache: "no-store" })
      .then((r) => r.ok ? r.json() : [])
      .then((data) => setCustomPages(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (mounted && status === "unauthenticated") {
      router.push("/login?callbackUrl=" + encodeURIComponent(pathname));
    }
  }, [mounted, status, router, pathname]);

  // Click outside listener for profile dropdown
  useEffect(() => {
    if (!profileDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (!profileDropdownRef.current?.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileDropdownOpen]);

  // Click outside listener for pages dropdown
  useEffect(() => {
    if (!pagesDropdownOpen) return;
    const handler = (e: MouseEvent) => {
      if (!pagesDropdownRef.current?.contains(e.target as Node)) {
        setPagesDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pagesDropdownOpen]);

  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen bg-[#070908] text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#b07e3a]" />
        <p className="text-sm font-medium tracking-widest text-[#a3b2a9] uppercase font-serif animate-pulse">Verifying Authority...</p>
      </div>
    );
  }

  const sessionUser = session?.user as AdminSessionUser | undefined;
  const userEmail = session?.user?.email?.toLowerCase().trim();
  const isAdmin = userEmail === "ikechukwualaeto@gmail.com" || sessionUser?.role === "admin";

  // Unauthenticated: proxy.ts will redirect, but show the spinner while that happens
  // so the user never sees the Access Denied flash during the in-flight redirect.
  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#070908] text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#b07e3a]" />
        <p className="text-sm font-medium tracking-widest text-[#a3b2a9] uppercase font-serif animate-pulse">Redirecting...</p>
      </div>
    );
  }
  
  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#070908] text-white flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6 border border-destructive/20">
          <Lock className="h-8 w-8 text-destructive animate-pulse" />
        </div>
        <h1 className="font-serif text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          You do not possess the administrative credentials to access the Naturalist command center.
        </p>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="h-11 px-8 rounded-full bg-destructive text-white hover:bg-destructive/90 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
        >
          Sign Out & Return Home
        </button>
      </div>
    );
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  const getPublicPreviewPath = () => {
    if (pathname.startsWith("/admin/pages/edit/")) {
      const key = pathname.replace("/admin/pages/edit/", "");
      const pathMap: Record<string, string> = {
        home: "/",
        shop: "/shop",
        bundles: "/bundles",
        story: "/story",
        sustainability: "/sustainability",
        blog: "/blog",
        "privacy-policy": "/privacy-policy",
        terms: "/terms",
        "cookie-policy": "/cookie-policy",
        "refund-policy": "/refund-policy",
        contact: "/contact",
        faq: "/faq",
      };
      return pathMap[key] || `/p/${key}`;
    }
    if (pathname.startsWith("/admin/pages/edit-custom/")) {
      const slug = pathname.replace("/admin/pages/edit-custom/", "");
      return `/p/${slug}`;
    }
    if (pathname.startsWith("/admin/products/edit/")) {
      const slug = pathname.replace("/admin/products/edit/", "");
      return `/shop/${slug}`;
    }
    if (pathname.startsWith("/admin/products")) {
      return "/shop";
    }
    if (pathname.startsWith("/admin/bundles")) {
      return "/bundles";
    }
    if (pathname.startsWith("/admin/blog")) {
      return "/blog";
    }
    return "/";
  };

  return (
    <div className="dark min-h-screen bg-[#070908] text-white font-sans flex flex-col transition-colors">
      
      {/* ── Branded Premium Top Navigation Bar ── */}
      <header className="sticky top-0 z-40 h-20 border-b border-[#1a241e] bg-[#0c100e]/95 backdrop-blur-md flex items-center justify-between px-6 sm:px-8">
        
        {/* Left: Brand logo & badge */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Mobile Hamburguer */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl text-[#a3b2a9] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
          >
            <Menu className="h-5.5 w-5.5" />
          </button>
          
          <div className="flex items-center gap-3">
            <a href="/admin" className="font-serif text-xl font-bold tracking-tight text-white hover:opacity-90 transition-opacity">
              Naturalist<span className="text-[#b07e3a]">.</span>
            </a>
            <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-[#b07e3a]/15 text-[#b07e3a] border border-[#b07e3a]/20 px-2.5 py-1 rounded-full">
              <ShieldCheck className="h-2.5 w-2.5" /> Admin
            </span>
          </div>
        </div>

        {/* Center: Desktop horizontal navigation links */}
        <div className="hidden lg:block flex-1 max-w-4xl mx-8">
          <nav className="flex items-center justify-center gap-1 xl:gap-2.5 py-2">
            {ADMIN_NAV_ITEMS.filter((item) => ["orders", "products", "bundles", "pages"].includes(item.id)).map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
              
              if (item.id === "pages") {
                return (
                  <div
                    key={item.id}
                    className="relative"
                    ref={pagesDropdownRef}
                  >
                    <button
                      type="button"
                      onClick={() => setPagesDropdownOpen(!pagesDropdownOpen)}
                      className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer ${
                        isActive
                          ? "bg-[#2d4c38] text-white shadow-[0_2px_12px_rgba(45,76,56,0.3)]"
                          : "text-[#a3b2a9] hover:text-white hover:bg-white/[0.04]"
                      }`}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                      <span>{item.label}</span>
                      <ChevronDown className="h-3 w-3 text-[#768e80]" />
                    </button>
                    
                    {pagesDropdownOpen && (
                      <div className="absolute left-1/2 -translate-x-1/2 mt-2 w-[760px] bg-[#0c100e]/95 backdrop-blur-md border border-[#1a241e] p-6 rounded-2xl shadow-2xl z-50 text-left grid grid-cols-3 gap-6 animate-scale-up">
                        {/* Column 1: Storefront Pages */}
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#b07e3a]">Storefront Pages</span>
                            <a
                              href="/admin/pages"
                              onClick={() => setPagesDropdownOpen(false)}
                              className="text-[8px] font-bold bg-[#b07e3a]/15 text-[#b07e3a] border border-[#b07e3a]/25 px-2 py-0.5 rounded-full hover:bg-[#b07e3a]/25 transition-all"
                            >
                              Manage All
                            </a>
                          </div>
                          <div className="flex flex-col gap-1 max-h-[380px] overflow-y-auto scrollbar-thin pr-1">
                            <a href="/admin/pages/edit/home" onClick={() => setPagesDropdownOpen(false)} className="px-3 py-1.5 rounded-xl text-xs text-[#a3b2a9] hover:text-white hover:bg-white/[0.03] transition-all flex flex-col">
                              <span className="font-serif font-bold text-white">Home Page</span>
                              <span className="text-[9px] text-[#768e80]">Banners, standards & ethos</span>
                            </a>
                            <a href="/admin/pages/edit/shop" onClick={() => setPagesDropdownOpen(false)} className="px-3 py-1.5 rounded-xl text-xs text-[#a3b2a9] hover:text-white hover:bg-white/[0.03] transition-all flex flex-col">
                              <span className="font-serif font-bold text-white">Shop Page</span>
                              <span className="text-[9px] text-[#768e80]">Product filters & headlines</span>
                            </a>
                            <a href="/admin/pages/edit/bundles" onClick={() => setPagesDropdownOpen(false)} className="px-3 py-1.5 rounded-xl text-xs text-[#a3b2a9] hover:text-white hover:bg-white/[0.03] transition-all flex flex-col">
                              <span className="font-serif font-bold text-white">Ritual Bundles</span>
                              <span className="text-[9px] text-[#768e80]">Set branding & tags</span>
                            </a>
                            <a href="/admin/pages/edit/story" onClick={() => setPagesDropdownOpen(false)} className="px-3 py-1.5 rounded-xl text-xs text-[#a3b2a9] hover:text-white hover:bg-white/[0.03] transition-all flex flex-col">
                              <span className="font-serif font-bold text-white">Our Story</span>
                              <span className="text-[9px] text-[#768e80]">Milestones & brand values</span>
                            </a>
                            <a href="/admin/pages/edit/sustainability" onClick={() => setPagesDropdownOpen(false)} className="px-3 py-1.5 rounded-xl text-xs text-[#a3b2a9] hover:text-white hover:bg-white/[0.03] transition-all flex flex-col">
                              <span className="font-serif font-bold text-white">Sustainability</span>
                              <span className="text-[9px] text-[#768e80]">Pillars & statistics</span>
                            </a>
                            <a href="/admin/pages/edit/blog" onClick={() => setPagesDropdownOpen(false)} className="px-3 py-1.5 rounded-xl text-xs text-[#a3b2a9] hover:text-white hover:bg-white/[0.03] transition-all flex flex-col">
                              <span className="font-serif font-bold text-white">Blog Index</span>
                              <span className="text-[9px] text-[#768e80]">Blog hero & defaults</span>
                            </a>
                            
                            <div className="h-px bg-[#1a241e] my-2 w-full" />
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#b07e3a] px-3 mb-1 block">Legal Policies</span>
                            <a href="/admin/pages/edit/privacy-policy" onClick={() => setPagesDropdownOpen(false)} className="px-3 py-1.5 rounded-lg text-[11px] text-white hover:bg-white/[0.03] transition-all block">Privacy Policy</a>
                            <a href="/admin/pages/edit/terms" onClick={() => setPagesDropdownOpen(false)} className="px-3 py-1.5 rounded-lg text-[11px] text-white hover:bg-white/[0.03] transition-all block">Terms of Service</a>
                            <a href="/admin/pages/edit/cookie-policy" onClick={() => setPagesDropdownOpen(false)} className="px-3 py-1.5 rounded-lg text-[11px] text-white hover:bg-white/[0.03] transition-all block">Cookie Policy</a>
                            <a href="/admin/pages/edit/refund-policy" onClick={() => setPagesDropdownOpen(false)} className="px-3 py-1.5 rounded-lg text-[11px] text-white hover:bg-white/[0.03] transition-all block">Refund Policy</a>
                          </div>
                        </div>
                        
                        {/* Column 2: Content & Catalog */}
                        <div className="flex flex-col gap-3">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#b07e3a]">Editorial & Media</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <a href="/admin/products" onClick={() => setPagesDropdownOpen(false)} className="px-3 py-2 rounded-xl text-xs text-[#a3b2a9] hover:text-white hover:bg-white/[0.03] transition-all flex flex-col">
                              <span className="font-serif font-bold text-white">Products Catalog</span>
                              <span className="text-[9px] text-[#768e80]">Manage storefront inventory</span>
                            </a>
                            <a href="/admin/bundles" onClick={() => setPagesDropdownOpen(false)} className="px-3 py-2 rounded-xl text-xs text-[#a3b2a9] hover:text-white hover:bg-white/[0.03] transition-all flex flex-col">
                              <span className="font-serif font-bold text-white">Ritual Bundles</span>
                              <span className="text-[9px] text-[#768e80]">Group product sets</span>
                            </a>
                            <a href="/admin/blog" onClick={() => setPagesDropdownOpen(false)} className="px-3 py-2 rounded-xl text-xs text-[#a3b2a9] hover:text-white hover:bg-white/[0.03] transition-all flex flex-col">
                              <span className="font-serif font-bold text-white">Blog Articles</span>
                              <span className="text-[9px] text-[#768e80]">Write posts & review comments</span>
                            </a>
                            <a href="/admin/cdn" onClick={() => setPagesDropdownOpen(false)} className="px-3 py-2 rounded-xl text-xs text-[#a3b2a9] hover:text-white hover:bg-white/[0.03] transition-all flex flex-col">
                              <span className="font-serif font-bold text-white">CDN Assets Uploads</span>
                              <span className="text-[9px] text-[#768e80]">Optimize website image assets</span>
                            </a>
                          </div>

                          <div className="h-px bg-[#1a241e] my-2 w-full" />
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#b07e3a]">Custom Pages</span>
                            <a href="/admin/pages/new" onClick={() => setPagesDropdownOpen(false)} className="text-[8px] font-bold bg-[#b07e3a]/15 text-[#b07e3a] border border-[#b07e3a]/25 px-2 py-0.5 rounded-full hover:bg-[#b07e3a]/25 transition-all">New Page</a>
                          </div>
                          <div className="flex flex-col gap-1 max-h-[140px] overflow-y-auto scrollbar-thin">
                            {customPages.length === 0 ? (
                              <span className="text-[10px] text-[#768e80] italic px-3 py-1.5">No custom pages</span>
                            ) : (
                              customPages.map((p) => (
                                <a
                                  key={p.metadata?.slug}
                                  href={`/admin/pages/edit-custom/${p.metadata?.slug}`}
                                  onClick={() => setPagesDropdownOpen(false)}
                                  className="px-3 py-1.5 rounded-lg text-[11px] font-medium text-[#a3b2a9] hover:text-white hover:bg-white/[0.03] transition-all truncate"
                                >
                                  {p.title || `/p/${p.metadata?.slug}`}
                                </a>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Column 3: Audience & Admin */}
                        <div className="flex flex-col gap-3">
                          <div>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#b07e3a]">Audience & Access</span>
                          </div>
                          <div className="flex flex-col gap-1">
                            <a href="/admin/newsletter" onClick={() => setPagesDropdownOpen(false)} className="px-3 py-2 rounded-xl text-xs text-[#a3b2a9] hover:text-white hover:bg-white/[0.03] transition-all flex flex-col">
                              <span className="font-serif font-bold text-white">Newsletter Subscriptions</span>
                              <span className="text-[9px] text-[#768e80]">Email subscriber database</span>
                            </a>
                            <a href="/admin/contacts" onClick={() => setPagesDropdownOpen(false)} className="px-3 py-2 rounded-xl text-xs text-[#a3b2a9] hover:text-white hover:bg-white/[0.03] transition-all flex flex-col">
                              <span className="font-serif font-bold text-white">Contact Inquiries</span>
                              <span className="text-[9px] text-[#768e80]">Customer support correspondence</span>
                            </a>
                            <a href="/admin/users" onClick={() => setPagesDropdownOpen(false)} className="px-3 py-2 rounded-xl text-xs text-[#a3b2a9] hover:text-white hover:bg-white/[0.03] transition-all flex flex-col">
                              <span className="font-serif font-bold text-white">User Directory</span>
                              <span className="text-[9px] text-[#768e80]">Credential overrides & roles</span>
                            </a>
                            <a href="/admin/users?tab=logs" onClick={() => setPagesDropdownOpen(false)} className="px-3 py-2 rounded-xl text-xs text-[#a3b2a9] hover:text-white hover:bg-white/[0.03] transition-all flex flex-col">
                              <span className="font-serif font-bold text-white">System Audit Logs</span>
                              <span className="text-[9px] text-[#768e80]">Chronological security registry</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <a
                  key={item.id}
                  href={item.href}
                  className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                    isActive
                      ? "bg-[#2d4c38] text-white shadow-[0_2px_12px_rgba(45,76,56,0.3)]"
                      : "text-[#a3b2a9] hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  <span>{item.label}</span>
                </a>
              );
            })}
          </nav>
        </div>

        {/* Right: View Shop & User profile avatar */}
        <div className="flex items-center gap-3 flex-shrink-0">

          {/* Profile Dropdown */}
          <div className="relative" ref={profileDropdownRef}>
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-full border border-[#1a241e] bg-white/[0.02] hover:bg-white/[0.04] transition-all cursor-pointer"
            >
              <div className="h-6.5 w-6.5 rounded-full bg-[#2d4c38] flex items-center justify-center font-bold text-xs text-[#b07e3a]">
                {session.user?.name ? session.user.name[0].toUpperCase() : "A"}
              </div>
              <span className="hidden md:inline text-xs font-bold text-[#a3b2a9] truncate max-w-[80px]">
                {session.user?.name?.split(" ")[0]}
              </span>
              <ChevronDown className="h-3 w-3 text-[#4a5c50]" />
            </button>

            {profileDropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-52 origin-top-right rounded-2xl border border-[#1a241e] bg-[#0c100e] p-2 shadow-2xl z-50">
                <div className="px-3 py-2 border-b border-[#1a241e] mb-1">
                  <p className="text-xs font-bold text-white truncate">{session.user?.name}</p>
                  <p className="text-[10px] text-[#a3b2a9] truncate">{session.user?.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-red-400 hover:bg-red-500/5 rounded-xl transition-all cursor-pointer text-left"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>

      </header>

      {/* ── Mobile Sidebar Drawer ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 bg-[#070908]/80 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0c100e] border-r border-[#1a241e] flex flex-col justify-between transform lg:hidden transition-transform duration-300 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div>
          <div className="p-6 border-b border-[#1a241e] flex items-center justify-between">
            <a href="/admin" className="font-serif text-xl font-bold tracking-tight text-white">
              Naturalist<span className="text-[#b07e3a]">.</span>
            </a>
            <button onClick={() => setSidebarOpen(false)} className="text-[#a3b2a9] hover:text-white cursor-pointer">
              <X className="h-5.5 w-5.5" />
            </button>
          </div>

          <nav className="p-4 space-y-1.5 overflow-y-auto">
            {ADMIN_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));
              return (
                <a
                  key={item.id}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    isActive
                      ? "bg-[#2d4c38] text-white"
                      : "text-[#a3b2a9] hover:text-white hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/50" />}
                </a>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-[#1a241e]">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-[#1a241e] mb-3">
            <div className="h-8 w-8 rounded-lg overflow-hidden bg-[#2d4c38] flex items-center justify-center font-bold text-sm text-[#b07e3a]">
              {session.user?.name ? session.user.name[0].toUpperCase() : "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate leading-none">{session.user?.name}</p>
              <p className="text-[10px] text-[#a3b2a9] truncate mt-1 leading-none">{session.user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all cursor-pointer text-left"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Viewport Content Area ── */}
      <main className={`flex-1 bg-[#070908] ${pathname === "/admin/email-sandbox" ? "overflow-hidden flex flex-col h-[calc(100vh-80px)]" : "overflow-y-auto p-6 lg:p-10"}`}>
        <div className={`animate-fade-in ${pathname === "/admin/email-sandbox" ? "w-full h-full flex flex-col min-h-0" : "max-w-5xl mx-auto"}`}>
          {children}
        </div>
      </main>

    </div>
  );
}
