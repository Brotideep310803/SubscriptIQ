"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  CreditCard,
  Plus,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Clock,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FileText,
  DollarSign,
  Info,
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/utils";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/components/ToastProvider";

export default function BillingPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "ADMIN";

  const [activeTab, setActiveTab] = useState<"events" | "invoices">("events");
  const [dataList, setDataList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [eventTypeFilter, setEventTypeFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 15 });

  // Simulator Modal states
  const [showSimulator, setShowSimulator] = useState(false);
  const [customers, setCustomers] = useState<any[]>([]);
  const [simCustomerId, setSimCustomerId] = useState("");
  const [simEventType, setSimEventType] = useState("PAYMENT_SUCCESS");
  const [simAmount, setSimAmount] = useState<number>(149.0);
  const [simMethod, setSimMethod] = useState("pm_card_visa");
  const [simFailureReason, setSimFailureReason] = useState("insufficient_funds");
  const [simIdempotencyKey, setSimIdempotencyKey] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchBillingData = useCallback(async () => {
    setLoading(true);
    try {
      const url =
        activeTab === "invoices"
          ? `/api/billing?tab=invoices&page=${page}&limit=15`
          : `/api/billing?tab=events&eventType=${eventTypeFilter}&page=${page}&limit=15`;

      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setDataList(activeTab === "invoices" ? json.invoices : json.events);
        setPagination(json.pagination);
      }
    } catch {
      toast.error("Failed to load billing records");
    } finally {
      setLoading(false);
    }
  }, [activeTab, page, eventTypeFilter, toast]);

  const fetchCustomerList = useCallback(async () => {
    try {
      const res = await fetch("/api/customers?limit=100");
      if (res.ok) {
        const json = await res.json();
        setCustomers(json.customers || []);
        if (json.customers?.[0]) setSimCustomerId(json.customers[0].id);
      }
    } catch (err) {
      console.error("Failed to load customer dropdown", err);
    }
  }, []);

  useEffect(() => {
    fetchBillingData();
  }, [fetchBillingData]);

  useEffect(() => {
    if (isAdmin) fetchCustomerList();
  }, [isAdmin, fetchCustomerList]);

  const openSimulatorModal = () => {
    const key = `evt_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setSimIdempotencyKey(key);
    setShowSimulator(true);
  };

  const handleSimulatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error("Only Administrators can trigger simulated payment events.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/billing/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: simCustomerId,
          eventType: simEventType,
          amount: Number(simAmount),
          currency: "USD",
          paymentMethod: simMethod,
          failureReason: simEventType === "PAYMENT_FAILED" ? simFailureReason : null,
          idempotencyKey: simIdempotencyKey,
        }),
      });

      const data = await res.json();

      if (res.status === 409) {
        toast.error(`Safeguard Triggered: ${data.error}`);
      } else if (!res.ok) {
        toast.error(data.error || "Simulation failed");
      } else {
        toast.success(`Simulated ${simEventType} processed ($${simAmount})!`);
        setShowSimulator(false);
        fetchBillingData();
      }
    } catch {
      toast.error("Network error while simulating event");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Simulation Notice Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-indigo-500/20 text-xs flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-xs">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 dark:text-white">
              Simulated Stripe-like Payment Environment
            </h3>
            <p className="text-slate-500 dark:text-slate-400 mt-0.5">
              All transactions, cards, and invoices are sandboxed simulations. Real payment credentials are never requested or stored.
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={openSimulatorModal}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-600/20 transition-all shrink-0"
          >
            Open Payment Simulator
          </button>
        )}
      </div>

      {/* Tabs & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="inline-flex p-1 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs font-semibold shadow-xs">
          <button
            onClick={() => {
              setActiveTab("events");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === "events"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Payment Events Log
          </button>
          <button
            onClick={() => {
              setActiveTab("invoices");
              setPage(1);
            }}
            className={`px-4 py-2 rounded-xl transition-all ${
              activeTab === "invoices"
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            Invoices
          </button>
        </div>

        {activeTab === "events" && (
          <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs">
            {["ALL", "PAYMENT_SUCCESS", "PAYMENT_FAILED", "PAYMENT_REFUNDED"].map((et) => (
              <button
                key={et}
                onClick={() => {
                  setEventTypeFilter(et);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  eventTypeFilter === et
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                {et === "ALL" ? "ALL" : et.replace("PAYMENT_", "")}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
            <span>Loading billing data...</span>
          </div>
        ) : dataList.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No records found for current criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            {activeTab === "events" ? (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">Event Type</th>
                    <th className="px-5 py-3">Customer / Org</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Method</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Idempotency Key</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dataList.map((evt) => (
                    <tr key={evt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5">
                        <span
                          className={`font-semibold ${
                            evt.eventType === "PAYMENT_SUCCESS"
                              ? "text-emerald-600 dark:text-emerald-400"
                              : evt.eventType === "PAYMENT_FAILED"
                              ? "text-red-600 dark:text-red-400"
                              : "text-amber-600 dark:text-amber-400"
                          }`}
                        >
                          {evt.eventType}
                        </span>
                        {evt.failureReason && (
                          <div className="text-[10px] text-red-500 italic mt-0.5">
                            {evt.failureReason}
                          </div>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/customers/${evt.customer?.id}`}
                          className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600"
                        >
                          {evt.customer?.companyName}
                        </Link>
                        <div className="text-[11px] text-slate-400">{evt.customer?.fullName}</div>
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(evt.amount)}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                        {evt.paymentMethod}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            evt.status === "SUCCESS"
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-500/20"
                              : evt.status === "REFUNDED"
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-500/20"
                              : "bg-red-50 dark:bg-red-950/40 text-red-600 border-red-500/20"
                          }`}
                        >
                          {evt.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-[10px] text-slate-400 max-w-xs truncate">
                        {evt.idempotencyKey}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{formatDateTime(evt.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">Invoice Number</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Plan Tier</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Due Date</th>
                    <th className="px-5 py-3">Paid Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {dataList.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/customers/${inv.customer?.id}`}
                          className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600"
                        >
                          {inv.customer?.companyName}
                        </Link>
                        <div className="text-[11px] text-slate-400">{inv.customer?.fullName}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                        {inv.subscription?.plan?.name || "Standard Plan"}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(inv.amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            inv.status === "PAID"
                              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-500/20"
                              : inv.status === "REFUNDED"
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-500/20"
                              : "bg-red-50 dark:bg-red-950/40 text-red-600 border-red-500/20"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{formatDate(inv.dueDate)}</td>
                      <td className="px-5 py-3.5 text-slate-500">{formatDate(inv.paidAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {dataList.length} of {pagination.total} records
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-medium">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PAYMENT SIMULATOR MODAL */}
      {showSimulator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center space-x-2 mb-1">
              <div className="p-1.5 rounded-lg bg-indigo-100 dark:bg-indigo-950 text-indigo-600">
                <CreditCard className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Stripe Payment Simulator
              </h2>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Simulate webhook payment events, failure conditions, and idempotency safeguards.
            </p>

            <form onSubmit={handleSimulatePayment} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer Account
                </label>
                <select
                  value={simCustomerId}
                  onChange={(e) => setSimCustomerId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.companyName} ({c.fullName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Event Type
                  </label>
                  <select
                    value={simEventType}
                    onChange={(e) => setSimEventType(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="PAYMENT_SUCCESS">PAYMENT_SUCCESS</option>
                    <option value="PAYMENT_FAILED">PAYMENT_FAILED</option>
                    <option value="PAYMENT_REFUNDED">PAYMENT_REFUNDED</option>
                    <option value="PAYMENT_PENDING">PAYMENT_PENDING</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    value={simAmount}
                    onChange={(e) => setSimAmount(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              {simEventType === "PAYMENT_FAILED" && (
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Failure Reason
                  </label>
                  <select
                    value={simFailureReason}
                    onChange={(e) => setSimFailureReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="card_declined: insufficient_funds">Card Declined: Insufficient Funds</option>
                    <option value="card_declined: expired_card">Card Declined: Expired Card</option>
                    <option value="card_declined: incorrect_cvc">Card Declined: Incorrect CVC</option>
                    <option value="gateway_timeout: bank_unresponsive">Gateway Timeout: Bank Unresponsive</option>
                  </select>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Idempotency Key (Duplicate Safeguard)
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setSimIdempotencyKey(
                        `evt_sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
                      )
                    }
                    className="text-[10px] text-indigo-600 hover:underline"
                  >
                    Generate New Key
                  </button>
                </div>
                <input
                  type="text"
                  value={simIdempotencyKey}
                  onChange={(e) => setSimIdempotencyKey(e.target.value)}
                  required
                  className="w-full px-3 py-2 font-mono text-[11px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Re-submitting with the same key tests our duplicate event safeguard.
                </span>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSimulator(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm flex items-center space-x-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Simulate Payment Event</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

