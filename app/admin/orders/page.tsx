"use client";

import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle,
  Truck,
  XCircle,
  User,
  MapPin,
  RefreshCw,
  Search,
  ChevronDown
} from "lucide-react";
import CustomDropdown from "@/components/ui/CustomDropdown";

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface ShippingAddress {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
}

interface Order {
  _id: string;
  orderNumber?: string;
  user: {
    _id: string;
    name: string;
    email: string;
  } | null;
  items: OrderItem[];
  shippingAddress: ShippingAddress;
  paymentStatus: "pending" | "paid" | "failed";
  shippingStatus: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  paymentMethod: string;
  totalAmount: number;
  createdAt: string;
  updatedAt: string;
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingId, setUpdatingId] = useState("");

  useEffect(() => {
    if (!searchQuery) {
      setDebouncedSearch("");
      setSearchLoading(false);
      return;
    }
    setSearchLoading(true);
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setSearchLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    document.title = "Order Management | Naturalist";
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await fetch("/api/admin/orders");
      if (!res.ok) throw new Error("Failed to load orders.");
      const data = await res.json();
      setOrders(data);
    } catch (e: any) {
      setError(e.message || "Failed to load orders list.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (
    orderId: string,
    field: "shippingStatus" | "paymentStatus",
    value: string
  ) => {
    try {
      setUpdatingId(orderId);
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: value }),
      });
      if (!res.ok) throw new Error("Failed to update status.");
      const updated = await res.json();
      
      // Update state
      setOrders(orders.map((o) => (o._id === orderId ? { ...o, ...updated } : o)));
      if (selectedOrder?._id === orderId) {
        setSelectedOrder({ ...selectedOrder, ...updated });
      }
    } catch (e: any) {
      alert(e.message || "Status update failed.");
    } finally {
      setUpdatingId("");
    }
  };

  const filteredOrders = orders.filter((o) => {
    const term = debouncedSearch.toLowerCase();
    const orderNum = o.orderNumber?.toLowerCase() || o._id.toLowerCase();
    const custName = o.user?.name.toLowerCase() || "guest";
    const custEmail = o.user?.email.toLowerCase() || "";
    
    const matchesSearch = orderNum.includes(term) || custName.includes(term) || custEmail.includes(term);
    const matchesStatus = !statusFilter || o.shippingStatus === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 pb-20 font-sans">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#b07e3a] font-sans">Fulfillment Center</span>
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white mt-1">Orders</h1>
        </div>
        <button
          onClick={fetchOrders}
          disabled={loading}
          className="flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-[#1a241e] bg-[#0c100e] text-xs font-bold text-[#a3b2a9] hover:text-white hover:bg-white/5 transition-all disabled:opacity-50 font-sans cursor-pointer"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh Registry
        </button>
      </div>

      {/* ── Filters Bar ── */}
      <div className="flex flex-col sm:flex-row gap-4 bg-[#0c100e] border border-[#1a241e] rounded-2xl p-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#a3b2a9]" />
          <input
            type="search"
            placeholder="Search by order #, customer name, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-10 rounded-xl border border-[#1a241e] bg-[#070908] text-sm text-white placeholder-white/40 focus:outline-none focus:border-[#b07e3a] transition-all font-sans"
          />
          {searchLoading && (
            <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[#b07e3a]" />
          )}
        </div>
        <CustomDropdown
          options={[
            { value: "", label: "All Shipping Status" },
            { value: "pending", label: "Pending" },
            { value: "processing", label: "Processing" },
            { value: "shipped", label: "Shipped" },
            { value: "delivered", label: "Delivered" },
            { value: "cancelled", label: "Cancelled" },
          ]}
          value={statusFilter}
          onChange={(val) => setStatusFilter(val)}
          className="w-full sm:w-56"
        />
      </div>

      {loading && orders.length === 0 ? (
        <div className="h-60 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[#b07e3a]" />
          <p className="text-xs text-[#a3b2a9] tracking-wider uppercase font-serif">Accessing Order Ledger...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6 flex items-start gap-4">
          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-destructive">Failed to Load Orders</p>
            <p className="text-xs text-[#a3b2a9] mt-1">{error}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Orders list table */}
          <div className="lg:col-span-8 bg-[#0c100e] border border-[#1a241e] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs divide-y divide-[#1a241e]">
                <thead>
                  <tr className="bg-[#0c100e] text-[#a3b2a9] font-bold uppercase tracking-wider">
                    <th className="p-4 sm:p-5">Order #</th>
                    <th className="p-4 sm:p-5">Customer</th>
                    <th className="p-4 sm:p-5 text-center">Shipping Status</th>
                    <th className="p-4 sm:p-5 text-center">Payment Status</th>
                    <th className="p-4 sm:p-5 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1a241e]/50">
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-12 text-center text-[#a3b2a9] text-sm">
                        No orders match the selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map((o) => {
                      const orderNum = o.orderNumber || `#${o._id.slice(-6).toUpperCase()}`;
                      const isSelected = selectedOrder?._id === o._id;
                      return (
                        <tr
                          key={o._id}
                          onClick={() => setSelectedOrder(o)}
                          className={`cursor-pointer hover:bg-white/[0.01] transition-colors ${
                            isSelected ? "bg-[#2d4c38]/10" : ""
                          }`}
                        >
                          <td className="p-4 sm:p-5 font-bold text-white">
                            {orderNum}
                            <span className="block text-[9px] font-normal text-[#a3b2a9] mt-1">
                              {new Date(o.createdAt).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          </td>
                          <td className="p-4 sm:p-5">
                            <p className="font-semibold text-white truncate max-w-[140px]">
                              {o.user ? o.user.name : "Guest"}
                            </p>
                            <p className="text-[10px] text-[#a3b2a9] truncate max-w-[140px] mt-0.5">
                              {o.user ? o.user.email : ""}
                            </p>
                          </td>
                          <td className="p-4 sm:p-5 text-center" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={o.shippingStatus}
                              disabled={updatingId === o._id}
                              onChange={(e) => handleUpdateStatus(o._id, "shippingStatus", e.target.value)}
                              className="h-8 px-2.5 rounded-lg border border-[#1a241e] bg-[#070908] text-[10px] font-bold uppercase tracking-wider text-[#b07e3a] focus:outline-none cursor-pointer focus:border-[#b07e3a] disabled:opacity-50 font-sans"
                            >
                              <option value="pending">Pending</option>
                              <option value="processing">Processing</option>
                              <option value="shipped">Shipped</option>
                              <option value="delivered">Delivered</option>
                              <option value="cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="p-4 sm:p-5 text-center" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={o.paymentStatus}
                              disabled={updatingId === o._id}
                              onChange={(e) => handleUpdateStatus(o._id, "paymentStatus", e.target.value)}
                              className="h-8 px-2.5 rounded-lg border border-[#1a241e] bg-[#070908] text-[10px] font-bold uppercase tracking-wider text-emerald-400 focus:outline-none cursor-pointer focus:border-emerald-500 disabled:opacity-50 font-sans"
                            >
                              <option value="pending">Pending</option>
                              <option value="paid">Paid</option>
                              <option value="failed">Failed</option>
                            </select>
                          </td>
                          <td className="p-4 sm:p-5 text-right font-bold text-white">
                            ${o.totalAmount.toFixed(2)}
                            <span className="block text-[9px] font-normal text-[#a3b2a9] mt-1 uppercase tracking-wider">
                              {o.items.length} {o.items.length === 1 ? "item" : "items"}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Order Details Panel */}
          <div className="lg:col-span-4 bg-[#0c100e] border border-[#1a241e] rounded-2xl p-6 space-y-6">
            {selectedOrder ? (
              <div className="space-y-6 animate-fade-in">
                
                {/* Header info */}
                <div className="border-b border-[#1a241e] pb-4">
                  <h3 className="font-serif text-lg font-bold">
                    Order Details
                  </h3>
                  <p className="text-xs text-[#a3b2a9] mt-1">
                    {selectedOrder.orderNumber || selectedOrder._id}
                  </p>
                </div>

                {/* Shipping info */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#b07e3a] flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" /> Shipping Address
                  </h4>
                  <div className="text-xs space-y-1 bg-white/[0.01] border border-[#1a241e] p-3.5 rounded-xl">
                    <p className="font-bold text-white">{selectedOrder.shippingAddress.name}</p>
                    <p className="text-[#a3b2a9]">{selectedOrder.shippingAddress.address}</p>
                    <p className="text-[#a3b2a9]">
                      {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} {selectedOrder.shippingAddress.zipCode}
                    </p>
                    <p className="text-[#a3b2a9]">{selectedOrder.shippingAddress.country}</p>
                    {selectedOrder.shippingAddress.phone && (
                      <p className="text-[#a3b2a9] mt-2 text-[10px]">
                        Phone: {selectedOrder.shippingAddress.phone}
                      </p>
                    )}
                  </div>
                </div>

                {/* Items */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#b07e3a] flex items-center gap-1.5">
                    <ShoppingBag className="h-3.5 w-3.5" /> Items Purchased
                  </h4>
                  <div className="divide-y divide-[#1a241e] max-h-48 overflow-y-auto pr-1">
                    {selectedOrder.items.map((item, index) => (
                      <div key={index} className="py-2.5 flex items-center gap-3 text-xs justify-between">
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white truncate">{item.name}</p>
                          <p className="text-[10px] text-[#a3b2a9] mt-0.5">
                            Qty {item.quantity} × ${item.price.toFixed(2)}
                          </p>
                        </div>
                        <p className="font-bold text-white flex-shrink-0">${(item.price * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="border-t border-[#1a241e] pt-4 space-y-2 text-xs">
                  <div className="flex justify-between text-[#a3b2a9]">
                    <span>Transaction Total</span>
                    <span className="font-bold text-white">${selectedOrder.totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-[#a3b2a9]">
                    <span>Payment Method</span>
                    <span className="font-semibold text-white capitalize">{selectedOrder.paymentMethod}</span>
                  </div>
                  <div className="flex justify-between text-[#a3b2a9]">
                    <span>Order Date</span>
                    <span className="font-semibold text-white">
                      {new Date(selectedOrder.createdAt).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                </div>

                {/* PDF generation link — future capability */}
                <button
                  onClick={() => alert("Enterprise PDF Generation triggered.")}
                  className="w-full py-2.5 rounded-xl border border-[#1a241e] bg-white/[0.01] hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-wider text-white font-sans cursor-pointer"
                >
                  Download Invoice (PDF)
                </button>

              </div>
            ) : (
              <div className="h-60 flex flex-col items-center justify-center text-center gap-3 text-[#a3b2a9]">
                <ShoppingBag className="h-8 w-8 opacity-20" />
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider">No Order Selected</p>
                  <p className="text-[10px] max-w-[200px] mt-1 leading-relaxed">
                    Select an order from the ledger table to view full shipping details and customer invoices.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
