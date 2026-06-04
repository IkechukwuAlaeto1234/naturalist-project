"use client";

import React, { useState, useEffect } from "react";

import {
  TrendingUp,
  ShoppingBag,
  Users,
  Package,
  ArrowRight,
  Loader2,
  Calendar,
  AlertCircle,
  Eye,
  Activity
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

interface OrderStats {
  id: string;
  customer: string;
  email: string;
  date: string;
  amount: number;
  status: string;
}

interface ChartItem {
  name: string;
  revenue: number;
}

interface DashboardStats {
  revenue: { total: number; percentageChange: number };
  orders: { total: number; percentageChange: number };
  customers: { total: number; percentageChange: number };
  products: { total: number };
  recentOrders: OrderStats[];
  revenueChart: ChartItem[];
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    document.title = "Admin Dashboard | Naturalist";
    fetchStats();
    fetchLogs();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/stats");
      if (!res.ok) throw new Error("Failed to load statistics.");
      const data = await res.json();
      setStats(data);
    } catch (e: any) {
      setError(e.message || "Failed to load dashboard statistics.");
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/admin/logs");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.slice(0, 5)); // show only top 5 recent registration logs
      }
    } catch (e) {
      console.error("Failed to load logs on dashboard", e);
    }
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
        <p className="text-xs text-[#a3b2a9] tracking-wider uppercase font-serif">Compiling Metrics...</p>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 flex items-start gap-4">
        <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-bold text-destructive">Dashboard Compilation Failed</p>
          <p className="text-xs text-[#a3b2a9] mt-1">{error}</p>
          <button onClick={fetchStats} className="mt-4 text-xs font-bold text-[#b07e3a] hover:underline uppercase tracking-wider">
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a]">Performance Command</span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white mt-1">Dashboard</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-[#a3b2a9] bg-[#0c100e] border border-[#1a241e] px-4 py-2.5 rounded-xl">
          <Calendar className="h-3.5 w-3.5 text-[#b07e3a]" />
          <span>Real-time Syncing · Live</span>
        </div>
      </div>

      {/* ── Grid stats cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Card 1: Revenue */}
        <div className="bg-[#0c100e] border border-[#1a241e] rounded-2xl p-6 hover:border-[#b07e3a]/30 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#a3b2a9]">Total Revenue</span>
            <div className="h-10 w-10 bg-[#b07e3a]/10 rounded-xl flex items-center justify-center text-[#b07e3a] border border-[#b07e3a]/20 group-hover:scale-105 transition-transform">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <h3 className="font-serif text-3xl font-bold mt-4">${stats.revenue.total.toFixed(2)}</h3>
          <p className="text-xs text-[#a3b2a9] mt-2 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">+{stats.revenue.percentageChange}%</span>
            <span>from last month</span>
          </p>
        </div>

        {/* Card 2: Orders */}
        <div className="bg-[#0c100e] border border-[#1a241e] rounded-2xl p-6 hover:border-[#b07e3a]/30 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#a3b2a9]">Total Orders</span>
            <div className="h-10 w-10 bg-[#2d4c38]/20 rounded-xl flex items-center justify-center text-emerald-400 border border-[#2d4c38]/40 group-hover:scale-105 transition-transform">
              <ShoppingBag className="h-5 w-5" />
            </div>
          </div>
          <h3 className="font-serif text-3xl font-bold mt-4">{stats.orders.total}</h3>
          <p className="text-xs text-[#a3b2a9] mt-2 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">+{stats.orders.percentageChange}%</span>
            <span>new orders</span>
          </p>
        </div>

        {/* Card 3: Customers */}
        <div className="bg-[#0c100e] border border-[#1a241e] rounded-2xl p-6 hover:border-[#b07e3a]/30 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#a3b2a9]">Customers Registered</span>
            <div className="h-10 w-10 bg-[#b07e3a]/10 rounded-xl flex items-center justify-center text-[#b07e3a] border border-[#b07e3a]/20 group-hover:scale-105 transition-transform">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <h3 className="font-serif text-3xl font-bold mt-4">{stats.customers.total}</h3>
          <p className="text-xs text-[#a3b2a9] mt-2 flex items-center gap-1.5">
            <span className="text-emerald-400 font-semibold">+{stats.customers.percentageChange}%</span>
            <span>organic signups</span>
          </p>
        </div>

        {/* Card 4: Products */}
        <div className="bg-[#0c100e] border border-[#1a241e] rounded-2xl p-6 hover:border-[#b07e3a]/30 transition-all duration-300 group">
          <div className="flex justify-between items-start">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#a3b2a9]">Active Catalog</span>
            <div className="h-10 w-10 bg-[#2d4c38]/20 rounded-xl flex items-center justify-center text-emerald-400 border border-[#2d4c38]/40 group-hover:scale-105 transition-transform">
              <Package className="h-5 w-5" />
            </div>
          </div>
          <h3 className="font-serif text-3xl font-bold mt-4">{stats.products.total}</h3>
          <p className="text-xs text-[#a3b2a9] mt-2">Active skincare products</p>
        </div>

      </div>

      {/* ── Revenue Chart Area ── */}
      <div className="bg-[#0c100e] border border-[#1a241e] rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h2 className="font-serif text-xl font-bold">Revenue Insights</h2>
            <p className="text-xs text-[#a3b2a9] mt-0.5">Aggregate of monthly paid transactions</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-[#b07e3a]" />
              <span className="text-[#a3b2a9]">Paid Invoices</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full text-xs min-w-0">
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
            <AreaChart data={stats.revenueChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#b07e3a" stopOpacity={0.25}/>
                  <stop offset="95%" stopColor="#b07e3a" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1c241e" />
              <XAxis dataKey="name" stroke="#a3b2a9" />
              <YAxis stroke="#a3b2a9" />
              <Tooltip 
                contentStyle={{ backgroundColor: "#0c100e", borderColor: "#1a241e", color: "#fff" }}
                itemStyle={{ color: "#b07e3a" }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#b07e3a" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Bottom Grid: Recent Orders & Account Creation Logs ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Recent Orders Table */}
        <div className="lg:col-span-8 bg-[#0c100e] border border-[#1a241e] rounded-2xl p-6 overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-serif text-xl font-bold">Recent Orders</h2>
              <p className="text-xs text-[#a3b2a9] mt-0.5">Track live transactions in the system</p>
            </div>
            <a
              href="/admin/orders"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#b07e3a] hover:underline uppercase tracking-wider"
            >
              All Orders <ArrowRight className="h-3 w-3" />
            </a>
          </div>

          {stats.recentOrders.length === 0 ? (
            <div className="py-12 text-center text-[#a3b2a9]">
              No transactions recorded in the system.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-[#1a241e]">
                <thead>
                  <tr className="text-[#a3b2a9] font-bold uppercase tracking-wider">
                    <th className="pb-3 font-semibold">Customer</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold text-right">Amount</th>
                    <th className="pb-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a241e]/50">
                  {stats.recentOrders.map((o) => {
                    const pillClass =
                      o.status === "paid"
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : o.status === "failed"
                        ? "bg-red-500/10 text-red-400 border border-red-500/20"
                        : "bg-[#b07e3a]/10 text-[#b07e3a] border border-[#b07e3a]/20";
                    return (
                      <tr key={o.id} className="hover:bg-white/[0.01]">
                        <td className="py-3.5 pr-3">
                          <p className="font-semibold text-white truncate max-w-[150px]">{o.customer}</p>
                          <p className="text-[10px] text-[#a3b2a9] truncate max-w-[150px] mt-0.5">{o.email}</p>
                        </td>
                        <td className="py-3.5 text-[#a3b2a9]">{o.date}</td>
                        <td className="py-3.5 text-right font-bold text-white">${o.amount.toFixed(2)}</td>
                        <td className="py-3.5 text-center">
                          <span className={`inline-flex px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full ${pillClass}`}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live Customer Account Activity Tracking Log */}
        <div className="lg:col-span-4 bg-[#0c100e] border border-[#1a241e] rounded-2xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="font-serif text-xl font-bold">User Registrations</h2>
              <p className="text-xs text-[#a3b2a9] mt-0.5">Auditing accounts creation</p>
            </div>
            <a
              href="/admin/users"
              className="h-8 w-8 rounded-lg border border-[#1a241e] flex items-center justify-center hover:bg-white/5 text-[#a3b2a9] hover:text-white transition-colors"
              title="Track in detail"
            >
              <Activity className="h-4 w-4" />
            </a>
          </div>

          {logs.length === 0 ? (
            <div className="py-12 text-center text-[#a3b2a9] text-xs">
              No registration logs available yet.
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log._id} className="p-3 rounded-xl bg-white/[0.01] border border-[#1a241e] flex gap-3 text-[11px] hover:border-[#b07e3a]/25 transition-all">
                  <div className="h-7 w-7 rounded-lg bg-[#b07e3a]/15 text-[#b07e3a] flex items-center justify-center font-bold flex-shrink-0 mt-0.5">
                    {log.name?.[0]?.toUpperCase() || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white truncate">{log.name}</p>
                    <p className="text-[10px] text-[#a3b2a9] truncate">{log.email}</p>
                    <p className="text-[9px] text-[#b07e3a] mt-1 uppercase">
                      {new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      {" · "}{log.action === "signup" ? "New Signup" : "Manual Add"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <a
            href="/admin/users?tab=logs"
            className="w-full text-center py-2.5 rounded-xl border border-[#1a241e] bg-white/[0.01] hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-wider text-[#a3b2a9] hover:text-white mt-6 block"
          >
            Audit System Logs
          </a>
        </div>

      </div>

    </div>
  );
}
