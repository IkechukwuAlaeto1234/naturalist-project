"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Loader2 } from "lucide-react";

/* ─────────────────────────────────────────────────────────────────
   Nav items — using Material Symbols Rounded ligatures (Gemini-style)
   ───────────────────────────────────────────────────────────────── */
const ADMIN_NAV_ITEMS = [
  { id: "dashboard",  label: "Dashboard",   href: "/admin",            icon: "dashboard" },
  { id: "orders",     label: "Orders",      href: "/admin/orders",     icon: "shopping_bag" },
  { id: "products",   label: "Products",    href: "/admin/products",   icon: "inventory_2" },
  { id: "bundles",    label: "Bundles",     href: "/admin/bundles",    icon: "layers" },
  { id: "pages",      label: "Pages",       href: "/admin/pages",      icon: "web" },
  { id: "blog",       label: "Blog",        href: "/admin/blog",       icon: "article" },
  { id: "users",      label: "Users",       href: "/admin/users",      icon: "group" },
  { id: "newsletter", label: "Newsletter",  href: "/admin/newsletter", icon: "mail" },
  { id: "contacts",   label: "Inquiries",   href: "/admin/contacts",   icon: "inbox" },
  { id: "emails",     label: "Email Hub",   href: "/admin/emails",     icon: "bolt" },
  { id: "cdn",        label: "CDN Assets",  href: "/admin/cdn",        icon: "image" },
];

type AdminSessionUser = { role?: string | null };

interface AdminNotif {
  _id: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

/* ═════════════════════════════════════════════════════════════════
   AdminShell
   ═════════════════════════════════════════════════════════════════ */
export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router   = useRouter();
  const pathname = usePathname();

  /* Sidebar always open on desktop; mobile uses drawer */
  const [open, setOpen]           = useState(true);
  /* Mobile drawer */
  const [mobileOpen, setMobileOpen] = useState(false);
  /* Profile dropdown */
  const [profileOpen, setProfileOpen] = useState(false);
  /* Bell dropdown */
  const [bellOpen, setBellOpen]       = useState(false);
  /* Notifications */
  const [notifications, setNotifications]   = useState<AdminNotif[]>([]);
  const [notifLoading, setNotifLoading]     = useState(false);
  /* Search */
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted]         = useState(false);

  const profileRef     = useRef<HTMLDivElement>(null);
  const bellRef        = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  /* ── Init ── */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* ── Auth guard ── */
  useEffect(() => {
    if (mounted && status === "unauthenticated") {
      router.push("/login?callbackUrl=" + encodeURIComponent(pathname));
    }
  }, [mounted, status, router, pathname]);

  /* ── Close mobile drawer on route change ── */
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  /* ── Mobile drawer toggle ── */
  const toggleSidebar = useCallback(() => {
    setMobileOpen(prev => !prev);
  }, []);

  /* ── Click-outside profile dropdown ── */
  useEffect(() => {
    if (!profileOpen) return;
    const handler = (e: MouseEvent) => {
      if (!profileRef.current?.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [profileOpen]);

  /* ── Click-outside bell dropdown ── */
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (!bellRef.current?.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [bellOpen]);

  /* ── Fetch admin notifications ── */
  const fetchNotifications = useCallback(async () => {
    try {
      setNotifLoading(true);
      const res = await fetch("/api/user/notifications", { cache: "no-store" });
      if (res.ok) setNotifications(await res.json());
    } catch { /* silent */ } finally {
      setNotifLoading(false);
    }
  }, []);

  useEffect(() => {
    if (mounted && status === "authenticated") fetchNotifications();
  }, [mounted, status, fetchNotifications]);

  const handleBellToggle = () => {
    setBellOpen(prev => {
      if (!prev) fetchNotifications();
      return !prev;
    });
    setProfileOpen(false);
  };

  const handleNotifClick = async (notif: AdminNotif) => {
    if (!notif.read) {
      await fetch("/api/user/notifications", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: notif._id }),
      });
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, read: true } : n));
    }
    setBellOpen(false);
    if (notif.link) window.location.href = notif.link;
  };

  const handleMarkAllRead = async () => {
    await fetch("/api/user/notifications", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  /* ── Body scroll lock on mobile drawer ── */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const handleSignOut = () => {
    signOut({ callbackUrl: (typeof window !== "undefined" ? window.location.origin : "") + "/login?logout=true" });
  };

  /* ── Loading ── */
  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen bg-[#faf8f4] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#b07e3a]" />
        <p className="text-sm font-medium tracking-widest text-[#8a9e90] uppercase font-serif animate-pulse">Verifying Authority…</p>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen bg-[#faf8f4] flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#b07e3a]" />
        <p className="text-sm font-medium tracking-widest text-[#8a9e90] uppercase font-serif animate-pulse">Redirecting…</p>
      </div>
    );
  }

  const sessionUser = session?.user as AdminSessionUser | undefined;
  const userEmail   = session?.user?.email?.toLowerCase().trim();
  const isAdmin     = userEmail === "ikechukwualaeto@gmail.com" || sessionUser?.role === "admin";

  if (!session || !isAdmin) {
    return (
      <div className="min-h-screen bg-[#faf8f4] flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100">
          <span className="ms ms-filled text-red-500" style={{ fontSize: 32 }}>lock</span>
        </div>
        <h1 className="font-serif text-2xl font-bold mb-2 text-[#141f19]">Access Denied</h1>
        <p className="text-sm text-[#5e6f64] mb-6 leading-relaxed">
          You do not possess the administrative credentials to access the Naturalist command center.
        </p>
        <button
          onClick={handleSignOut}
          className="h-11 px-8 rounded-full bg-red-500 text-white hover:bg-red-600 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
        >
          Sign Out & Return Home
        </button>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     Render
     ───────────────────────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-[#faf8f4] flex font-sans">

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ══════════════════════════════════════════════════════════
          Sidebar — Gemini-style
          Width: 72px (icon-only) → 256px (expanded)
          NO hover expand. Toggle-only.
          ══════════════════════════════════════════════════════════ */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40
          flex flex-col bg-white border-r border-[#e8e0d5]
          overflow-hidden w-64
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* ── Logo / Brand row ── */}
        <div className="h-16 flex items-center flex-shrink-0 px-5 gap-3 border-b border-[#e8e0d5]">
          {/* N orb */}
          <div className="h-9 w-9 rounded-full bg-[#2d4c38] flex items-center justify-center flex-shrink-0">
            <span className="font-serif text-sm font-black text-white">N</span>
          </div>
          {/* Brand name */}
          <a href="/admin" className="flex-1 min-w-0 hover:opacity-75 transition-opacity whitespace-nowrap">
            <span className="font-serif text-[15px] font-extrabold tracking-tight text-[#141f19]">Naturalist</span>
            <span className="font-serif text-[15px] font-extrabold tracking-tight text-[#b07e3a]"> Admin</span>
          </a>
        </div>

        {/* ── Nav items ── */}
        <nav className="flex-1 sidebar-scroll overflow-y-auto overflow-x-hidden py-3 space-y-0.5 px-2">
          {ADMIN_NAV_ITEMS.map((item) => {
            const isActive =
              item.id === "dashboard"
                ? pathname === "/admin"
                : pathname === item.href || (item.href !== "/admin" && pathname?.startsWith(item.href));

            return (
              <div key={item.id} className="relative group/nav">
                <a
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={`
                    flex items-center gap-3 rounded-2xl transition-all duration-200 overflow-hidden
                    ${open ? "px-3 py-2.5" : "justify-center px-0 py-2.5 mx-auto w-12 h-12"}
                    ${isActive
                      ? "bg-[#e8f0eb] text-[#2d4c38]"
                      : "text-[#5e6f64] hover:bg-[#f0ebe2] hover:text-[#141f19]"
                    }
                  `}
                >
                  {/* Material Symbol icon */}
                  <span
                    className={`ms flex-shrink-0 transition-all ${isActive ? "ms-filled text-[#2d4c38]" : "text-[#8a9e90]"}`}
                    style={{ fontSize: 22 }}
                  >
                    {item.icon}
                  </span>

                  {/* Label — only visible when open */}
                  <span className={`text-sm font-semibold whitespace-nowrap transition-all duration-300 ${open ? "opacity-100" : "opacity-0 w-0 overflow-hidden"} ${isActive ? "font-bold text-[#141f19]" : ""}`}>
                    {item.label}
                  </span>
                </a>

                {/* Tooltip always available for collapsed mobile drawer state */}
                <div className="pointer-events-none absolute left-full top-1/2 -translate-y-1/2 ml-3 z-[9999] opacity-0 group-hover/nav:opacity-100 transition-opacity duration-150 lg:hidden">
                  <div className="bg-[#1f2937] text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
                    {item.label}
                  </div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* ── Footer removed — user info lives in header dropdown ── */}
      </aside>

      {/* ══════════════════════════════════════════════════════════
          Right column: Header + Content
          ══════════════════════════════════════════════════════════ */}
      <div
        className="flex flex-col flex-1 min-w-0 lg:ml-64"
      >

        {/* ── Gemini-style Top Header ── */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#e8e0d5] flex items-center gap-3 px-4 sm:px-5">

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 rounded-2xl text-[#5e6f64] hover:text-[#141f19] hover:bg-[#f5f2ed] transition-all cursor-pointer flex-shrink-0"
            aria-label="Open menu"
          >
            <span className="ms" style={{ fontSize: 22 }}>menu</span>
          </button>

          {/* ── Gemini-style centered search bar ── */}
          <div className="flex-1 max-w-xl mx-auto">
            <div className="relative group">
              <span className="ms absolute left-4 top-1/2 -translate-y-1/2 text-[#8a9e90] group-focus-within:text-[#2d4c38] transition-colors pointer-events-none" style={{ fontSize: 18 }}>search</span>
              <input
                ref={searchInputRef}
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search orders, products, inquiries…"
                className="w-full h-10 pl-11 pr-4 rounded-full bg-[#f5f2ed] border border-[#e2dacd] text-sm text-[#141f19] placeholder-[#8a9e90] focus:outline-none focus:border-[#b07e3a] focus:bg-white transition-all"
                onKeyDown={(e) => {
                  if (e.key === "Escape") {
                    setSearchQuery("");
                    searchInputRef.current?.blur();
                  }
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full text-[#8a9e90] hover:text-[#141f19] hover:bg-[#e2dacd] transition-all cursor-pointer"
                >
                  <span className="ms" style={{ fontSize: 16 }}>close</span>
                </button>
              )}
            </div>
          </div>

          {/* ── Right actions ── */}
          <div className="flex items-center gap-1.5 flex-shrink-0">

            {/* Bell */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={handleBellToggle}
                className="relative h-9 w-9 rounded-full flex items-center justify-center text-[#5e6f64] hover:text-[#141f19] hover:bg-[#f5f2ed] transition-all cursor-pointer"
                aria-label="Notifications"
                title="Notifications"
              >
                <span className="ms" style={{ fontSize: 22 }}>notifications</span>
                {notifications.some(n => !n.read) && (
                  <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#b07e3a] ring-2 ring-white" />
                )}
              </button>

              {bellOpen && (
                <div className="absolute right-0 mt-2 w-80 origin-top-right rounded-2xl border border-[#e2dacd] bg-white shadow-xl z-50 overflow-hidden">
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[#e2dacd]">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8a9e90]">Notifications</p>
                    {notifications.some(n => !n.read) && (
                      <button
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-bold text-[#b07e3a] hover:underline uppercase tracking-wider cursor-pointer"
                      >
                        Mark all read
                      </button>
                    )}
                  </div>

                  {/* Body */}
                  <div className="max-h-72 overflow-y-auto">
                    {notifLoading ? (
                      <div className="flex items-center justify-center py-8 gap-2">
                        <span className="ms animate-spin text-[#b07e3a]" style={{ fontSize: 20 }}>progress_activity</span>
                        <span className="text-xs text-[#8a9e90]">Loading…</span>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 gap-2 text-center px-4">
                        <span className="ms text-[#e2dacd]" style={{ fontSize: 36 }}>notifications_off</span>
                        <p className="text-xs font-semibold text-[#8a9e90]">No notifications yet</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-[#f5f2ed]">
                        {notifications.slice(0, 10).map((notif) => (
                          <button
                            key={notif._id}
                            onClick={() => handleNotifClick(notif)}
                            className={`w-full text-left px-4 py-3 flex gap-3 items-start hover:bg-[#faf8f4] transition-colors cursor-pointer ${
                              !notif.read ? "bg-[#b07e3a]/5" : ""
                            }`}
                          >
                            <span className={`mt-1.5 h-2 w-2 rounded-full flex-shrink-0 ${
                              !notif.read ? "bg-[#b07e3a]" : "bg-transparent"
                            }`} />
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs leading-snug truncate ${
                                !notif.read ? "font-bold text-[#141f19]" : "font-medium text-[#5e6f64]"
                              }`}>
                                {notif.title}
                              </p>
                              <p className="text-[11px] text-[#8a9e90] mt-0.5 line-clamp-2 leading-relaxed">
                                {notif.message}
                              </p>
                              <p className="text-[10px] text-[#8a9e90]/60 mt-1">
                                {new Date(notif.createdAt).toLocaleDateString("en-US", {
                                  month: "short", day: "numeric",
                                  hour: "2-digit", minute: "2-digit",
                                })}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  {notifications.length > 0 && (
                    <div className="border-t border-[#e2dacd] px-4 py-2.5">
                      <a
                        href="/account/notifications"
                        className="text-[10px] font-bold text-[#b07e3a] hover:underline uppercase tracking-wider"
                      >
                        View all notifications
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Profile dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-[#e2dacd] bg-white hover:bg-[#f5f2ed] transition-all cursor-pointer"
                title="Account menu"
              >
                <div className="h-6 w-6 rounded-full bg-[#2d4c38] flex items-center justify-center font-bold text-[10px] text-[#b07e3a]">
                  {session.user?.name ? session.user.name[0].toUpperCase() : "A"}
                </div>
                <span className="hidden sm:inline text-xs font-semibold text-[#5e6f64] truncate max-w-[80px]">
                  {session.user?.name?.split(" ")[0]}
                </span>
                <span className="ms text-[#8a9e90]" style={{ fontSize: 16 }}>expand_more</span>
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-52 origin-top-right rounded-2xl border border-[#e2dacd] bg-white p-2 shadow-xl z-50 animate-fade-in">
                  <div className="px-3 py-2 border-b border-[#e2dacd] mb-1">
                    <p className="text-xs font-bold text-[#141f19] truncate">{session.user?.name}</p>
                    <p className="text-[10px] text-[#8a9e90] truncate">{session.user?.email}</p>
                  </div>
                  <a
                    href="/"
                    target="_blank"
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-[#5e6f64] hover:bg-[#f5f2ed] rounded-xl transition-all"
                  >
                    <span className="ms" style={{ fontSize: 16 }}>open_in_new</span>
                    View Storefront
                  </a>
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2.5 px-3 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer text-left mt-0.5"
                  >
                    <span className="ms" style={{ fontSize: 16 }}>logout</span>
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Main Content ── */}
        <main
          className={`flex-1 admin-content-area ${
            pathname === "/admin/email-sandbox"
              ? "overflow-hidden flex flex-col h-[calc(100vh-64px)]"
              : "overflow-y-auto p-6 lg:p-8"
          }`}
        >
          <div
            className={`animate-fade-in ${
              pathname === "/admin/email-sandbox"
                ? "w-full h-full flex flex-col min-h-0"
                : "max-w-5xl mx-auto"
            }`}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
