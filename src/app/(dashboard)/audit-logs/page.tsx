"use client";

import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  User,
  Activity,
  Lock,
} from "lucide-react";
import { formatDateTime } from "@/lib/utils";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/components/ToastProvider";

export default function AuditLogsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAuthorized = user?.role === "ADMIN" || user?.role === "MANAGER";

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [entityFilter, setEntityFilter] = useState("ALL");
  const [actionFilter, setActionFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1, limit: 20 });

  const fetchAuditLogs = async () => {
    if (!isAuthorized) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/audit-logs?page=${page}&limit=20&entityType=${entityFilter}&action=${actionFilter}`
      );
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs || []);
        setPagination(json.pagination);
      }
    } catch {
      toast.error("Failed to load audit trail");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, entityFilter, actionFilter, user]);

  if (!isAuthorized) {
    return (
      <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
        <Lock className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Access Restricted: Audit Logs
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2">
          Your current role (<strong>{user?.role}</strong>) does not have governance permissions to inspect the compliance audit log trail.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Tamper-proof governance banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Compliance & Security Audit Trail
            </h1>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Tamper-Proof
            </span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Immutable log of state mutations, administrative decisions, and access events.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs text-xs">
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-slate-400 font-semibold">Entity:</span>
          {["ALL", "PLAN", "CUSTOMER", "SUBSCRIPTION", "BILLING", "USER"].map((ent) => (
            <button
              key={ent}
              onClick={() => {
                setEntityFilter(ent);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                entityFilter === ent
                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              {ent}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-slate-400 font-semibold">Action:</span>
          {["ALL", "CREATE", "UPDATE", "CANCEL", "SIMULATE_PAYMENT"].map((act) => (
            <button
              key={act}
              onClick={() => {
                setActionFilter(act);
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                actionFilter === act
                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-bold"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
              }`}
            >
              {act === "SIMULATE_PAYMENT" ? "SIMULATE" : act}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        {loading ? (
          <div className="h-48 flex items-center justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
            <span>Loading audit log entries...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-xs">No audit logs matching this filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                <tr>
                  <th className="px-5 py-3">Timestamp</th>
                  <th className="px-5 py-3">Actor</th>
                  <th className="px-5 py-3">Action</th>
                  <th className="px-5 py-3">Entity Type</th>
                  <th className="px-5 py-3">Change Summary</th>
                  <th className="px-5 py-3 font-mono text-[11px]">Entity ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="px-5 py-3.5 text-slate-500 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {log.user?.name || log.userEmail}
                      </div>
                      <div className="text-[10px] text-slate-400">{log.user?.role || "USER"}</div>
                    </td>
                    <td className="px-5 py-3.5 whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                          log.action === "CREATE"
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 border-emerald-500/20"
                            : log.action === "UPDATE"
                            ? "bg-blue-50 dark:bg-blue-950/40 text-blue-600 border-blue-500/20"
                            : log.action === "CANCEL" || log.action === "DELETE"
                            ? "bg-red-50 dark:bg-red-950/40 text-red-600 border-red-500/20"
                            : log.action === "SIMULATE_PAYMENT"
                            ? "bg-purple-50 dark:bg-purple-950/40 text-purple-600 border-purple-500/20"
                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 border-slate-300"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-300">
                      {log.entityType}
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300 max-w-md truncate">
                      {log.changeSummary}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-[10px] text-slate-400">
                      {log.entityId ? log.entityId.substring(0, 12) + "..." : "—"}
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
              Showing {logs.length} of {pagination.total} audit logs
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
  );
}
