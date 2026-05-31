"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  FileText,
  Users,
  Mail,
  Image as ImageIcon,
  LogOut,
  Menu,
  X,
  Lock,
  Loader2,
  ChevronRight,
  ShieldCheck
} from "lucide-react";

const SIDEBAR_ITEMS = [
  { id: "dashboard", label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { id: "orders", label: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { id: "products", label: "Products", href: "/admin/products", icon: Package },
  { id: "blog", label: "Blog Writing", href: "/admin/blog", icon: FileText },
  { id: "users", label: "Users & Logs", href: "/admin/users", icon: Users },
  { id: "newsletter", label: "Newsletter", href: "/admin/newsletter", icon: Mail },
  { id: "cdn", label: "CDN Uploads", href: "/admin/cdn", icon: ImageIcon },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && status === "unauthenticated") {
      router.push("/login?callbackUrl=" + encodeURIComponent(pathname));
    }
  }, [mounted, status, router, pathname]);

  if (!mounted || status === "loading") {
    return (
      <div className="min-h-screen bg-[#070908] text-white flex flex-col items-center justify-center gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-[#b07e3a]" />
        <p className="text-sm font-medium tracking-widest text-[#a3b2a9] uppercase font-serif">Verifying Authority...</p>
      </div>
    );
  }

  // Double check admin role
  if (!session || (session.user as any)?.role !== "admin") {
    return (
      <div className="min-h-screen bg-[#070908] text-white flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto">
        <div className="h-16 w-16 bg-destructive/10 rounded-full flex items-center justify-center mb-6 border border-destructive/20">
          <Lock className="h-8 w-8 text-destructive animate-pulse" />
        </div>
        <h1 className="font-serif text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          You are authenticated, but do not possess the required administrative credentials to access the Naturalist command center.
        </p>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="h-10 px-6 rounded-full bg-destructive text-white hover:bg-destructive/90 text-xs font-bold uppercase tracking-wider transition-all"
        >
          Sign Out & Return Home
        </button>
      </div>
    );
  }

  const handleSignOut = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-[#070908] text-white font-sans flex transition-colors">
      
      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-[#1a241e] bg-[#0c100e] flex-shrink-0 relative">
        <div className="p-6 border-b border-[#1a241e] flex items-center justify-between">
          <Link href="/" className="font-serif text-xl font-bold tracking-tight text-white hover:opacity-90 transition-opacity">
            Naturalist<span className="text-[#b07e3a]">.</span>
          </Link>
          <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-[#b07e3a]/10 text-[#b07e3a] border border-[#b07e3a]/30 px-2 py-0.5 rounded-full">
            <ShieldCheck className="h-2 w-2" /> Admin
          </span>
        </div>

        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {SIDEBAR_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? "bg-[#2d4c38] text-white shadow-[0_2px_12px_rgba(45,76,56,0.3)]"
                    : "text-[#a3b2a9] hover:text-white hover:bg-white/[0.04]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <item.icon className={`h-4 w-4 ${isActive ? "text-[#b07e3a]" : ""}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/50" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#1a241e]">
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.02] border border-[#1a241e] mb-3">
            <div className="h-8 w-8 rounded-lg overflow-hidden bg-[#2d4c38] flex items-center justify-center font-bold text-sm text-[#b07e3a]">
              {session.user?.name ? session.user.name[0].toUpperCase() : "A"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate leading-none">{session.user?.name}</p>
              <p className="text-[10px] text-[#a3b2a9] truncate mt-1 leading-none">Command Center</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

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
            <Link href="/" className="font-serif text-xl font-bold tracking-tight text-white">
              Naturalist<span className="text-[#b07e3a]">.</span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="text-[#a3b2a9] hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="p-4 space-y-1.5 overflow-y-auto">
            {SIDEBAR_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
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
                </Link>
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
            className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* ── Main Viewport ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header Bar */}
        <header className="h-16 border-b border-[#1a241e] bg-[#070908] flex items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-lg text-[#a3b2a9] hover:text-white hover:bg-white/5"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-xs font-black uppercase tracking-[0.25em] text-[#b07e3a] hidden sm:block">
              Naturalist Enterprise Suite v1.0
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-xs font-bold uppercase tracking-wider text-[#a3b2a9] hover:text-white transition-colors border border-[#1a241e] px-4 py-2 rounded-full hover:bg-white/5"
            >
              View Shop
            </Link>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto bg-[#070908] p-6 lg:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </main>
      </div>

    </div>
  );
}
