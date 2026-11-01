"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  TrendingUp,
  Download,
  Percent,
  Calendar,
  DollarSign,
  Users,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/components/ToastProvider";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAuthorized = user?.role === "ADMIN" || user?.role === "MANAGER";

  const [revData, setRevData] = useState<any>(null);
  const [churnData, setChurnData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    if (!isAuthorized) return;
    setLoading(true);
    try {
      const [rRes, cRes] = await Promise.all([
        fetch("/api/analytics/revenue"),
        fetch("/api/analytics/churn"),
      ]);

      if (rRes.ok && cRes.ok) {
        setRevData(await rRes.json());
        setChurnData(await cRes.json());
      }
    } catch {
      toast.error("Failed to load analytics trends");
    } finally {
      setLoading(false);
    }
  }, [isAuthorized, toast]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleExportCSV = (type: "customers" | "subscriptions" | "invoices") => {
    window.location.href = `/api/analytics/export?type=${type}`;
    toast.success(`Exporting ${type} report to CSV...`);
  };

  if (!isAuthorized) {
    return (
      <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900">
        <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
          Access Restricted: Financial Analytics
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-2">
          Your current role (<strong>{user?.role}</strong>) does not have executive permissions to view sensitive financial forecasting and churn models.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header and Export Reports Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Executive Analytics & Financial Intelligence
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Historical cohort analysis, retention curves, LTV benchmarks, and data exports.
          </p>
        </div>

        {/* CSV Export Dropdown / Buttons */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={() => handleExportCSV("customers")}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Customers CSV</span>
          </button>
          <button
            onClick={() => handleExportCSV("subscriptions")}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Subscriptions CSV</span>
          </button>
          <button
            onClick={() => handleExportCSV("invoices")}
            className="inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Invoices CSV</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mr-2" />
          <span>Crunching financial intelligence data...</span>
        </div>
      ) : (
        <>
          {/* Executive KPI Stat Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold uppercase text-slate-400">Current MRR</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(revData?.metrics?.mrr || 0)}
              </div>
              <p className="text-xs text-emerald-500 font-medium mt-1 flex items-center">
                <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                <span>+{revData?.metrics?.momGrowthRate || 0}% MoM growth</span>
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold uppercase text-slate-400">Annual Run-Rate (ARR)</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(revData?.metrics?.arr || 0)}
              </div>
              <p className="text-xs text-slate-400 mt-1">Contractual 12-month run rate</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold uppercase text-slate-400">Avg Revenue Per User (ARPU)</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatCurrency(revData?.metrics?.arpu || 0)}
              </div>
              <p className="text-xs text-slate-400 mt-1">Monthly normalized average</p>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <span className="text-xs font-semibold uppercase text-slate-400">Active Contracts</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                {formatNumber(revData?.metrics?.activeSubscriptions || 0)}
              </div>
              <p className="text-xs text-indigo-500 font-medium mt-1">Enterprise & Pro tiers</p>
            </div>
          </div>

          {/* Deep-dive Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Revenue & MRR Growth Curve */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                12-Month Revenue & MRR Trajectory
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Comparison of actual cash collections vs normalized monthly recurring revenue
              </p>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revData?.trends || []}>
                    <defs>
                      <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `$${v >= 1000 ? `${v / 1000}k` : v}`}
                    />
                    <Tooltip
                      formatter={(val: any) => [formatCurrency(Number(val))]}
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "0.75rem",
                        color: "#f8fafc",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      name="Collected Revenue"
                      stroke="#6366f1"
                      strokeWidth={2}
                      fillOpacity={0.1}
                      fill="#6366f1"
                    />
                    <Area
                      type="monotone"
                      dataKey="mrr"
                      name="MRR Benchmark"
                      stroke="#8b5cf6"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#mrrGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Churn Rate History */}
            <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                Customer Churn Rate Trends (%)
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                Monthly customer attrition percentage based on cancellation events
              </p>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={churnData?.churnTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="%" />
                    <Tooltip
                      formatter={(val: any) => [`${val}%`, "Churn Rate"]}
                      contentStyle={{
                        backgroundColor: "#0f172a",
                        borderColor: "#334155",
                        borderRadius: "0.75rem",
                        color: "#f8fafc",
                        fontSize: "12px",
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                    <Line
                      type="monotone"
                      dataKey="rate"
                      name="Churn Rate %"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Churned Accounts Analysis Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                Churned Accounts & Tenure Analysis
              </h3>
              <p className="text-xs text-slate-400">
                Audit of customer departures, contract lifespan, and churn impact
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">Customer / Company</th>
                    <th className="px-5 py-3">Plan Tier</th>
                    <th className="px-5 py-3">Contract Value</th>
                    <th className="px-5 py-3">Customer Tenure</th>
                    <th className="px-5 py-3">Cancellation Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {churnData?.churnDetails?.map((c: any) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {c.companyName}
                        </div>
                        <div className="text-[11px] text-slate-400">{c.customerName}</div>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                        {c.planName}
                      </td>
                      <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                        {formatCurrency(c.amount)}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                        {c.tenureMonths} months
                      </td>
                      <td className="px-5 py-3.5 text-red-500 font-medium">
                        {formatDate(c.cancelledAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

