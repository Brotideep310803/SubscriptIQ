"use client";

import React, { useState, useEffect } from "react";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  Repeat,
  AlertTriangle,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  CheckCircle2,
  Clock,
  HelpCircle,
  Loader2,
  Layers,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { formatCurrency, formatNumber, formatDate } from "@/lib/utils";
import { useAuth } from "@/components/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any>(null);
  const [growthData, setGrowthData] = useState<any>(null);

  const fetchData = async (selectedPeriod: string) => {
    setLoading(true);
    setError(null);
    try {
      const [sumRes, revRes, subRes] = await Promise.all([
        fetch(`/api/dashboard/summary?period=${selectedPeriod}`),
        fetch(`/api/dashboard/revenue?period=${selectedPeriod}`),
        fetch(`/api/dashboard/subscriptions?period=${selectedPeriod}`),
      ]);

      if (!sumRes.ok) throw new Error("Failed to load dashboard summary");
      const sumJson = await sumRes.json();
      setSummary(sumJson);

      if (revRes.ok) {
        const revJson = await revRes.json();
        setRevenueData(revJson);
      }

      if (subRes.ok) {
        const subJson = await subRes.json();
        setGrowthData(subJson);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard metrics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period);
  }, [period]);

  const metrics = summary?.metrics;
  const isSupport = user?.role === "SUPPORT_AGENT";

  const COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#8b5cf6"];

  return (
    <div className="space-y-8">
      {/* Header with Title and Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Subscription Analytics Overview
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time KPIs, recurring revenue trends, and customer lifecycle metrics.
          </p>
        </div>

        {/* Date Filter Pills */}
        <div className="inline-flex p-1 rounded-xl bg-slate-200/60 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 self-start sm:self-auto">
          {[
            { label: "7 Days", value: "7d" },
            { label: "30 Days", value: "30d" },
            { label: "90 Days", value: "90d" },
            { label: "12 Months", value: "12m" },
          ].map((item) => (
            <button
              key={item.value}
              onClick={() => setPeriod(item.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === item.value
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {loading && !summary ? (
        <div className="h-64 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
          <p className="text-sm">Calculating real-time analytics from database...</p>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-950/20 text-red-700 dark:text-red-400 text-sm">
          {error}
        </div>
      ) : (
        <>
          {/* Support Agent Warning / Notice */}
          {isSupport && (
            <div className="p-3.5 rounded-xl border border-blue-500/20 bg-blue-50/50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 text-xs flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 shrink-0 text-blue-500" />
              <span>
                Support Agent View: Sensitive executive financial metrics (Revenue, MRR, ARR) are masked in accordance with role-based governance.
              </span>
            </div>
          )}

          {/* 7 KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Revenue */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Revenue</span>
                <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {isSupport ? "Confidential" : formatCurrency(metrics?.totalRevenue || 0)}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 flex items-center">
                <span className="text-emerald-500 font-medium inline-flex items-center mr-1">
                  <ArrowUpRight className="w-3.5 h-3.5" /> Period: {isSupport ? "—" : formatCurrency(metrics?.periodRevenue || 0)}
                </span>
              </p>
            </div>

            {/* 2. Monthly Recurring Revenue (MRR) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">MRR</span>
                <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {isSupport ? "Confidential" : formatCurrency(metrics?.mrr || 0)}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Normalized monthly subscription value
              </p>
            </div>

            {/* 3. Annual Recurring Revenue (ARR) */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">ARR</span>
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400">
                  <Calendar className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {isSupport ? "Confidential" : formatCurrency(metrics?.arr || 0)}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Run-rate annualized MRR (MRR × 12)
              </p>
            </div>

            {/* 4. Total Customers */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Total Customers</span>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatNumber(metrics?.totalCustomers || 0)}
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                +{metrics?.newCustomersInPeriod || 0} onboarded in period
              </p>
            </div>

            {/* 5. Active Subscriptions */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Active Subscriptions</span>
                <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 text-cyan-600 dark:text-cyan-400">
                  <Repeat className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatNumber(metrics?.activeSubscriptions || 0)}
              </div>
              <p className="text-xs text-emerald-500 font-medium mt-1">
                Active recurring billing contracts
              </p>
            </div>

            {/* 6. Churn Rate */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Churn Rate</span>
                <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900 dark:text-white">
                {metrics?.churnRate || 0}%
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Cancelled vs total active in window
              </p>
            </div>

            {/* 7. Failed Payments */}
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs sm:col-span-2 lg:col-span-2">
              <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider">Payment Health</span>
                <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline space-x-4">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">
                  {metrics?.failedPaymentsCount || 0}{" "}
                  <span className="text-sm font-normal text-slate-400">failed</span>
                </div>
                <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                  {metrics?.paymentSuccessRate || 0}% Success Rate
                </div>
              </div>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                At-risk revenue: {isSupport ? "—" : formatCurrency(metrics?.failedPaymentsAmount || 0)}
              </p>
            </div>
          </div>

          {/* Visual Charts Section (Managers & Admins) */}
          {!isSupport && revenueData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: Monthly Revenue Trend */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                      Revenue History
                    </h3>
                    <p className="text-xs text-slate-400">Collected subscription payments over time</p>
                  </div>
                  <div className="text-xs font-medium px-2.5 py-1 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    Monthly
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData.revenueTimeline || []}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={(val) => `$${val >= 1000 ? `${val / 1000}k` : val}`}
                      />
                      <Tooltip
                        formatter={(val: any) => [formatCurrency(Number(val)), "Revenue"]}
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "0.75rem",
                          color: "#f8fafc",
                          fontSize: "12px",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#6366f1"
                        strokeWidth={2.5}
                        fillOpacity={1}
                        fill="url(#revGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Customer Acquisition & Subscription Growth */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                      Growth & Acquisition
                    </h3>
                    <p className="text-xs text-slate-400">New customer signups vs subscription creations</p>
                  </div>
                  <div className="text-xs font-medium px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                    Cohort Growth
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={growthData?.growthTimeline || []}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "0.75rem",
                          color: "#f8fafc",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                      <Bar dataKey="customers" name="Customers" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="subscriptions" name="Subscriptions" fill="#10b981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 3: Revenue by Subscription Plan */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                      Plan Performance Breakdown
                    </h3>
                    <p className="text-xs text-slate-400">Monthly recurring revenue contribution by plan</p>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={revenueData.planRevenueBreakdown || []}
                      margin={{ left: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis
                        type="number"
                        tick={{ fontSize: 11 }}
                        tickFormatter={(v) => `$${v}`}
                      />
                      <YAxis type="category" dataKey="planName" tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(val: any) => [formatCurrency(Number(val)), "MRR Contribution"]}
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "0.75rem",
                          color: "#f8fafc",
                          fontSize: "12px",
                        }}
                      />
                      <Bar dataKey="monthlyRevenue" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 4: Payment Success vs Failure */}
              <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                      Payment Success vs Failure
                    </h3>
                    <p className="text-xs text-slate-400">Processed billing attempts per month</p>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueData.revenueTimeline || []}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f172a",
                          borderColor: "#334155",
                          borderRadius: "0.75rem",
                          color: "#f8fafc",
                          fontSize: "12px",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                      <Bar dataKey="successful" name="Success" fill="#10b981" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="failed" name="Failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Metric Definitions & Formulas Accordion Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-100 to-indigo-50/30 dark:from-slate-900 dark:to-indigo-950/20 border border-slate-200 dark:border-slate-800 text-xs">
            <h4 className="font-bold text-slate-800 dark:text-slate-200 mb-2 flex items-center space-x-1.5">
              <HelpCircle className="w-4 h-4 text-indigo-500" />
              <span>Standardized SaaS Analytics Formulas</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-slate-600 dark:text-slate-400">
              <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                <span className="font-semibold text-slate-900 dark:text-slate-100">MRR Formula:</span>
                <p className="mt-0.5 font-mono text-[11px] text-indigo-600 dark:text-indigo-400">
                  Σ(Monthly Plans + Annual Plans / 12)
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                <span className="font-semibold text-slate-900 dark:text-slate-100">ARR Formula:</span>
                <p className="mt-0.5 font-mono text-[11px] text-purple-600 dark:text-purple-400">
                  MRR × 12
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Churn Rate:</span>
                <p className="mt-0.5 font-mono text-[11px] text-amber-600 dark:text-amber-400">
                  (Cancelled Subs / Total Active) × 100
                </p>
              </div>
              <div className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-800/60 border border-slate-200/50 dark:border-slate-700/50">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Customer LTV:</span>
                <p className="mt-0.5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                  ARPU / Monthly Churn Decimal
                </p>
              </div>
            </div>
          </div>

          {/* Recent Invoices Table */}
          <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900 dark:text-white text-base">
                  Recent Invoicing Activity
                </h3>
                <p className="text-xs text-slate-400">Latest generated invoices from database</p>
              </div>
              <a
                href="/billing"
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
              >
                View all billing →
              </a>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
                  <tr>
                    <th className="px-5 py-3">Invoice Number</th>
                    <th className="px-5 py-3">Customer</th>
                    <th className="px-5 py-3">Company</th>
                    <th className="px-5 py-3">Amount</th>
                    <th className="px-5 py-3">Status</th>
                    <th className="px-5 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {summary?.recentInvoices?.map((inv: any) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="px-5 py-3.5 font-medium text-slate-900 dark:text-slate-100">
                        {inv.invoiceNumber}
                      </td>
                      <td className="px-5 py-3.5 text-slate-600 dark:text-slate-300">
                        {inv.customer?.fullName}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">{inv.customer?.companyName}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                        {isSupport ? "—" : formatCurrency(inv.amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            inv.status === "PAID"
                              ? "bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 border border-green-500/20"
                              : inv.status === "REFUNDED"
                              ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                              : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-500/20"
                          }`}
                        >
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-slate-400">{formatDate(inv.createdAt)}</td>
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

