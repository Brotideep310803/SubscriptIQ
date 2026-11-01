"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Gauge,
  Plus,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  HardDrive,
  Activity,
  Users,
  CreditCard,
  Search,
} from "lucide-react";
import { formatNumber, formatDateTime } from "@/lib/utils";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/components/ToastProvider";

export default function UsagePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const canRecord = user?.role === "ADMIN" || user?.role === "MANAGER";

  const [records, setRecords] = useState<any[]>([]);
  const [usageSummaries, setUsageSummaries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [metricFilter, setMetricFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });

  // Record usage modal
  const [showModal, setShowModal] = useState(false);
  const [selectedSub, setSelectedSub] = useState<any | null>(null);
  const [metricType, setMetricType] = useState("API_REQUESTS");
  const [amount, setAmount] = useState<number>(1000);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchUsageData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/usage?page=${page}&limit=20&metricType=${metricFilter}`);
      if (res.ok) {
        const data = await res.json();
        setRecords(data.records || []);
        setUsageSummaries(data.usageSummaries || []);
        setPagination(data.pagination);
        if (data.usageSummaries?.[0]) setSelectedSub(data.usageSummaries[0]);
      }
    } catch {
      toast.error("Failed to load usage tracking data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
  }, [page, metricFilter]);

  const handleRecordUsage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSub) {
      toast.error("Please select a target customer subscription.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/usage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subscriptionId: selectedSub.subscriptionId,
          customerId: selectedSub.customerId,
          metricType,
          amount: Number(amount),
          notes: notes || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to record usage");
      } else {
        if (data.usageStatus?.isExceeded) {
          toast.error(`ALERT: Usage exceeds plan limit by ${data.usageStatus.percentage}%!`);
        } else if (data.usageStatus?.isWarning) {
          toast.info(`Warning: Customer has reached ${data.usageStatus.percentage}% of allocation.`);
        } else {
          toast.success("Usage telemetry logged successfully!");
        }
        setShowModal(false);
        fetchUsageData();
      }
    } catch {
      toast.error("Network error while recording usage");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Resource Consumption & Usage Limits
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time quota monitoring, limit warnings, and telemetry ingestion.
          </p>
        </div>

        {canRecord && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Ingest Usage Event</span>
          </button>
        )}
      </div>

      {/* Quota Monitoring Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Active Subscriber Quota Health (API Requests)
          </h2>
          <span className="text-xs text-slate-400">
            {usageSummaries.length} active customer meters
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {usageSummaries.map((s) => (
            <div
              key={s.subscriptionId}
              className={`p-5 rounded-2xl border bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between transition-all ${
                s.status === "EXCEEDED"
                  ? "border-red-500/40 dark:border-red-900/60 ring-1 ring-red-500/20"
                  : s.status === "WARNING"
                  ? "border-amber-500/40 dark:border-amber-900/60 ring-1 ring-amber-500/20"
                  : "border-slate-200/80 dark:border-slate-800"
              }`}
            >
              <div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <Link
                      href={`/customers/${s.customerId}`}
                      className="font-bold text-sm text-slate-900 dark:text-white hover:text-indigo-600 transition-colors"
                    >
                      {s.companyName}
                    </Link>
                    <div className="text-xs text-slate-400">{s.planName} Tier</div>
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      s.status === "EXCEEDED"
                        ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-500/30"
                        : s.status === "WARNING"
                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-500/30"
                        : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    }`}
                  >
                    {s.status === "EXCEEDED"
                      ? "LIMIT EXCEEDED"
                      : s.status === "WARNING"
                      ? "WARNING >80%"
                      : "NORMAL"}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
                    <span className="text-slate-600 dark:text-slate-300">
                      {formatNumber(s.currentUsage)} / {formatNumber(s.limit)} units
                    </span>
                    <span
                      className={`font-bold ${
                        s.status === "EXCEEDED"
                          ? "text-red-600 dark:text-red-400"
                          : s.status === "WARNING"
                          ? "text-amber-600 dark:text-amber-400"
                          : "text-indigo-600 dark:text-indigo-400"
                      }`}
                    >
                      {s.percentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        s.status === "EXCEEDED"
                          ? "bg-red-500"
                          : s.status === "WARNING"
                          ? "bg-amber-500"
                          : "bg-indigo-600"
                      }`}
                      style={{ width: `${Math.min(100, s.percentage)}%` }}
                    />
                  </div>
                </div>
              </div>

              {s.status === "EXCEEDED" && (
                <div className="mt-3 text-[11px] text-red-600 dark:text-red-400 flex items-center space-x-1 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>Customer requires plan upgrade or add-on quota.</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Historical Usage Log Table */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Telemetry Ingestion Logs
          </h2>

          <div className="flex items-center space-x-1.5 p-1 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 self-start sm:self-auto text-xs">
            {["ALL", "API_REQUESTS", "STORAGE_MB", "ACTIVE_USERS", "TRANSACTIONS"].map((mt) => (
              <button
                key={mt}
                onClick={() => {
                  setMetricFilter(mt);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                  metricFilter === mt
                    ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold"
                    : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                }`}
              >
                {mt.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {loading ? (
            <div className="h-48 flex items-center justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
              <span>Loading usage records...</span>
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Gauge className="w-10 h-10 mx-auto mb-2 opacity-50" />
              <p className="text-xs">No telemetry logs found for this filter.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">Customer / Organization</th>
                    <th className="px-5 py-3">Plan Tier</th>
                    <th className="px-5 py-3">Metric Type</th>
                    <th className="px-5 py-3">Recorded Consumption</th>
                    <th className="px-5 py-3">Timestamp</th>
                    <th className="px-5 py-3">Alert Flags & Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/customers/${r.customerId}`}
                          className="font-semibold text-slate-900 dark:text-white hover:text-indigo-600 transition-colors"
                        >
                          {r.customer?.companyName}
                        </Link>
                        <div className="text-[11px] text-slate-400">{r.customer?.fullName}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                        {r.subscription?.plan?.name}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                        {r.metricType}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-indigo-600 dark:text-indigo-400">
                        {formatNumber(r.amount)}{" "}
                        <span className="text-[10px] text-slate-400 font-normal">
                          {r.metricType === "STORAGE_MB" ? "MB" : "units"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{formatDateTime(r.recordedAt)}</td>
                      <td className="px-5 py-3.5">
                        {r.notes ? (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              r.notes.includes("ALERT") || r.notes.includes("EXCEEDED")
                                ? "bg-red-50 dark:bg-red-950/40 text-red-600 border-red-500/30"
                                : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-500/30"
                            }`}
                          >
                            {r.notes}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing {records.length} of {pagination.total} records
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
      </div>

      {/* RECORD USAGE MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Ingest Customer Usage
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Simulate real-time resource telemetry consumption.
            </p>

            <form onSubmit={handleRecordUsage} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Customer & Plan
                </label>
                <select
                  value={selectedSub?.subscriptionId || ""}
                  onChange={(e) => {
                    const match = usageSummaries.find((s) => s.subscriptionId === e.target.value);
                    if (match) setSelectedSub(match);
                  }}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {usageSummaries.map((s) => (
                    <option key={s.subscriptionId} value={s.subscriptionId}>
                      {s.companyName} ({s.planName} — Limit: {formatNumber(s.limit)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Metric Type
                </label>
                <select
                  value={metricType}
                  onChange={(e) => setMetricType(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="API_REQUESTS">API_REQUESTS</option>
                  <option value="STORAGE_MB">STORAGE_MB</option>
                  <option value="ACTIVE_USERS">ACTIVE_USERS</option>
                  <option value="TRANSACTIONS">TRANSACTIONS</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Units Consumed
                </label>
                <input
                  type="number"
                  min="1"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes (Optional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Batch data import job"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
                  <span>Log Telemetry</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

