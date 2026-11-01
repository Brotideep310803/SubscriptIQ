"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Repeat,
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  RotateCw,
  XCircle,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Loader2,
  Calendar,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/components/ToastProvider";

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const canManage = user?.role === "ADMIN" || user?.role === "MANAGER";

  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 15 });

  // Create Sub Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [selectedCycle, setSelectedCycle] = useState("MONTHLY");

  // Upgrade/Change Plan Modal
  const [changingSub, setChangingSub] = useState<any | null>(null);
  const [newPlanId, setNewPlanId] = useState("");
  const [newCycle, setNewCycle] = useState("MONTHLY");

  // Cancel confirmation
  const [cancellingSub, setCancellingSub] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/subscriptions?page=${page}&limit=15&status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
        setPagination(data.pagination);
      }
    } catch {
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const fetchDependencies = async () => {
    try {
      const [plansRes, custRes] = await Promise.all([
        fetch("/api/plans?status=ACTIVE"),
        fetch("/api/customers?limit=100&status=ACTIVE"),
      ]);
      if (plansRes.ok) {
        const pData = await plansRes.json();
        setPlans(pData.plans || []);
        if (pData.plans?.[0]) setSelectedPlanId(pData.plans[0].id);
      }
      if (custRes.ok) {
        const cData = await custRes.json();
        setCustomers(cData.customers || []);
        if (cData.customers?.[0]) setSelectedCustomerId(cData.customers[0].id);
      }
    } catch {
      console.error("Failed to load plans or customers");
    }
  };

  useEffect(() => {
    fetchSubscriptions();
    fetchDependencies();
  }, [page, statusFilter]);

  const handleCreateSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !selectedPlanId) {
      toast.error("Please select both a customer and a subscription plan.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          planId: selectedPlanId,
          billingCycle: selectedCycle,
          status: "ACTIVE",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to create subscription");
      } else {
        toast.success("Subscription created successfully!");
        setShowCreateModal(false);
        fetchSubscriptions();
      }
    } catch {
      toast.error("Network error creating subscription");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changingSub) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/subscriptions/${changingSub.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: newPlanId,
          billingCycle: newCycle,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update plan");
      } else {
        toast.success("Plan updated successfully!");
        setChangingSub(null);
        fetchSubscriptions();
      }
    } catch {
      toast.error("Network error updating subscription plan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSub = async () => {
    if (!cancellingSub) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/subscriptions/${cancellingSub.id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to cancel");
      } else {
        toast.success("Subscription cancelled. Historical data preserved.");
        setCancellingSub(null);
        fetchSubscriptions();
      }
    } catch {
      toast.error("Network error cancelling subscription");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRenewSub = async (subId: string) => {
    try {
      const res = await fetch(`/api/subscriptions/${subId}/renew`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to renew");
      } else {
        toast.success("Subscription renewed and invoice processed.");
        fetchSubscriptions();
      }
    } catch {
      toast.error("Network error renewing subscription");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Subscription Lifecycle Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track active, trialing, cancelled, past due, and expired subscriber contracts.
          </p>
        </div>

        {canManage && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create Subscription</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1.5 p-1.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-x-auto">
        {["ALL", "ACTIVE", "TRIALING", "CANCELLED", "PAST_DUE", "EXPIRED"].map((st) => (
          <button
            key={st}
            onClick={() => {
              setStatusFilter(st);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              statusFilter === st
                ? "bg-indigo-600 text-white shadow-xs"
                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
            <span>Loading subscriptions...</span>
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="p-12 text-center">
            <Repeat className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">No subscriptions found</h3>
            <p className="text-xs text-slate-400 mt-1">Adjust filters or create a new subscription.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">Customer / Organization</th>
                  <th className="px-5 py-3">Assigned Plan</th>
                  <th className="px-5 py-3">Cycle</th>
                  <th className="px-5 py-3">Recurring Amount</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Renewal / End Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {subscriptions.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5">
                      <Link
                        href={`/customers/${s.customer?.id}`}
                        className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 transition-colors"
                      >
                        {s.customer?.fullName}
                      </Link>
                      <div className="text-[11px] text-slate-400">{s.customer?.companyName}</div>
                    </td>
                    <td className="px-5 py-3.5 font-bold text-indigo-600 dark:text-indigo-400">
                      {s.plan?.name}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                      {s.billingCycle}
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(s.amount)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          s.status === "ACTIVE"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-500/20"
                            : s.status === "TRIALING"
                            ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-500/20"
                            : s.status === "PAST_DUE"
                            ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-500/20"
                            : s.status === "CANCELLED"
                            ? "bg-red-50 dark:bg-red-950/40 text-red-600 border-red-500/20"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300"
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-500">
                      {s.status === "CANCELLED" && s.cancellationDate ? (
                        <span className="text-red-500">
                          Cancelled {formatDate(s.cancellationDate)}
                        </span>
                      ) : (
                        formatDate(s.renewalDate)
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      {canManage && (
                        <div className="flex items-center justify-end space-x-2">
                          {s.status === "ACTIVE" && (
                            <>
                              <button
                                onClick={() => {
                                  setChangingSub(s);
                                  setNewPlanId(s.planId);
                                  setNewCycle(s.billingCycle);
                                }}
                                title="Upgrade or Change Plan"
                                className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-indigo-600 font-medium text-[11px]"
                              >
                                Change Plan
                              </button>
                              <button
                                onClick={() => setCancellingSub(s)}
                                title="Cancel Subscription"
                                className="text-red-600 hover:text-red-700 font-semibold text-[11px]"
                              >
                                Cancel
                              </button>
                            </>
                          )}
                          {(s.status === "CANCELLED" || s.status === "PAST_DUE" || s.status === "EXPIRED") && (
                            <button
                              onClick={() => handleRenewSub(s.id)}
                              className="px-2 py-1 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 font-semibold text-[11px] flex items-center space-x-1"
                            >
                              <RotateCw className="w-3 h-3" />
                              <span>Renew</span>
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {subscriptions.length} of {pagination.total} subscriptions
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

      {/* CREATE SUBSCRIPTION MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Create Customer Subscription
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Provision a subscription tier for an existing customer.
            </p>

            <form onSubmit={handleCreateSubscription} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Customer
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} ({c.companyName})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Subscription Tier
                </label>
                <select
                  value={selectedPlanId}
                  onChange={(e) => setSelectedPlanId(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ${p.monthlyPrice}/mo (${p.annualPrice}/yr)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Billing Cycle
                </label>
                <select
                  value={selectedCycle}
                  onChange={(e) => setSelectedCycle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="MONTHLY">MONTHLY</option>
                  <option value="ANNUAL">ANNUAL</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
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
                  <span>Create Subscription</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPGRADE / CHANGE PLAN MODAL */}
      {changingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Change Plan for {changingSub.customer?.companyName}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Select a new subscription tier or update billing interval.
            </p>

            <form onSubmit={handleChangePlan} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Plan
                </label>
                <select
                  value={newPlanId}
                  onChange={(e) => setNewPlanId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {plans.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ${p.monthlyPrice}/mo (${p.annualPrice}/yr)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Billing Cycle
                </label>
                <select
                  value={newCycle}
                  onChange={(e) => setNewCycle(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="MONTHLY">MONTHLY</option>
                  <option value="ANNUAL">ANNUAL</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setChangingSub(null)}
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
                  <span>Apply Plan Update</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION DIALOG */}
      {cancellingSub && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Cancel Subscription for {cancellingSub.customer?.companyName}?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              The subscription will transition to CANCELLED status. In accordance with system data retention rules, historical billing records and usage logs will remain accessible for auditing.
            </p>
            <div className="flex justify-end space-x-3 mt-6 text-xs">
              <button
                type="button"
                onClick={() => setCancellingSub(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
              >
                Go Back
              </button>
              <button
                type="button"
                onClick={handleCancelSub}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold flex items-center space-x-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Cancellation</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
