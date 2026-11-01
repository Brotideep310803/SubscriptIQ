"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Users,
  Building,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Repeat,
  Gauge,
  ArrowLeft,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Layers,
} from "lucide-react";
import { formatCurrency, formatDate, formatDateTime, formatNumber } from "@/lib/utils";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/components/ToastProvider";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const customerId = params.id as string;
  const isAdmin = user?.role === "ADMIN";
  const canEdit = user?.role === "ADMIN" || user?.role === "MANAGER" || user?.role === "SUPPORT_AGENT";

  const [customer, setCustomer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"subscriptions" | "invoices" | "billing" | "usage">("subscriptions");

  // Edit modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formStatus, setFormStatus] = useState("ACTIVE");
  const [submitting, setSubmitting] = useState(false);

  // Cancel sub modal
  const [cancellingSubId, setCancellingSubId] = useState<string | null>(null);

  const fetchCustomerData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`);
      if (!res.ok) throw new Error("Customer not found");
      const data = await res.json();
      setCustomer(data.customer);

      setFormName(data.customer.fullName);
      setFormCompany(data.customer.companyName);
      setFormPhone(data.customer.contactNumber || "");
      setFormStatus(data.customer.status);
    } catch (err: any) {
      toast.error(err.message || "Failed to load customer profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchCustomerData();
    }
  }, [customerId]);

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/customers/${customerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formName,
          companyName: formCompany,
          contactNumber: formPhone || null,
          status: formStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to update customer");
      } else {
        toast.success("Customer details updated successfully");
        setShowEditModal(false);
        fetchCustomerData();
      }
    } catch {
      toast.error("Network error while updating");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelSubscription = async (subId: string) => {
    try {
      const res = await fetch(`/api/subscriptions/${subId}/cancel`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to cancel subscription");
      } else {
        toast.success("Subscription cancelled successfully.");
        setCancellingSubId(null);
        fetchCustomerData();
      }
    } catch {
      toast.error("Network error while cancelling subscription");
    }
  };

  const handleDeleteCustomer = async () => {
    if (!isAdmin) return;
    if (!confirm("Are you sure you want to permanently delete this customer account?")) return;

    try {
      const res = await fetch(`/api/customers/${customerId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Customer deleted.");
        router.push("/customers");
      } else {
        const d = await res.json();
        toast.error(d.error || "Failed to delete");
      }
    } catch {
      toast.error("Error deleting customer");
    }
  };

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mr-2" />
        <span>Loading customer profile...</span>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Customer not found</h2>
        <Link href="/customers" className="mt-3 inline-block text-xs font-semibold text-indigo-600 hover:underline">
          ← Back to customers
        </Link>
      </div>
    );
  }

  const activeSub = customer.subscriptions?.find((s: any) => s.status === "ACTIVE");

  return (
    <div className="space-y-6">
      {/* Back button and Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/customers"
          className="inline-flex items-center text-xs font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 space-x-1"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers</span>
        </Link>

        <div className="flex items-center space-x-2">
          {canEdit && (
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-xs"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Account</span>
            </button>
          )}

          {isAdmin && (
            <button
              onClick={handleDeleteCustomer}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/20 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          )}
        </div>
      </div>

      {/* Profile Overview Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xl border border-indigo-200/40 dark:border-indigo-800">
              {customer.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  {customer.fullName}
                </h2>
                <span
                  className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
                    customer.status === "ACTIVE"
                      ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                      : customer.status === "CHURNED"
                      ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-500/20"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300"
                  }`}
                >
                  {customer.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center space-x-2">
                <span>{customer.companyName}</span>
                <span>•</span>
                <span>ID: {customer.id.substring(0, 8)}...</span>
              </p>
            </div>
          </div>

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Email</span>
              <p className="font-medium text-slate-700 dark:text-slate-300 truncate">
                {customer.email}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Phone</span>
              <p className="font-medium text-slate-700 dark:text-slate-300">
                {customer.contactNumber || "—"}
              </p>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Joined</span>
              <p className="font-medium text-slate-700 dark:text-slate-300">
                {formatDate(customer.createdAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Current Active Plan Banner */}
        {activeSub ? (
          <div className="mt-6 p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-indigo-600 text-white shadow-xs">
                <Repeat className="w-4 h-4" />
              </div>
              <div>
                <span className="text-slate-500 dark:text-slate-400 text-[11px]">Current Plan:</span>
                <div className="font-bold text-slate-900 dark:text-white text-sm">
                  {activeSub.plan.name} Plan • {formatCurrency(activeSub.amount)} /{" "}
                  {activeSub.billingCycle.toLowerCase()}
                </div>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">Renews on:</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {formatDate(activeSub.renewalDate)}
              </span>
            </div>
          </div>
        ) : (
          <div className="mt-6 p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/60 text-amber-800 dark:text-amber-300 text-xs">
            No active subscription associated with this account.
          </div>
        )}
      </div>

      {/* Detail Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-800 flex space-x-4 text-xs font-semibold">
        {[
          { id: "subscriptions", label: "Subscriptions History", count: customer.subscriptions?.length },
          { id: "invoices", label: "Invoices", count: customer.invoices?.length },
          { id: "billing", label: "Payment Events", count: customer.billingEvents?.length },
          { id: "usage", label: "Usage Logs", count: customer.usageRecords?.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === tab.id
                ? "border-indigo-600 text-indigo-600 dark:text-indigo-400"
                : "border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
            }`}
          >
            <span>{tab.label}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
              {tab.count || 0}
            </span>
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      {/* 1. Subscriptions Tab */}
      {activeTab === "subscriptions" && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Billing Cycle</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Start Date</th>
                <th className="px-5 py-3">Renewal Date</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customer.subscriptions?.map((sub: any) => (
                <tr key={sub.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-white">
                    {sub.plan.name}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                    {sub.billingCycle}
                  </td>
                  <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(sub.amount)}
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        sub.status === "ACTIVE"
                          ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                          : sub.status === "CANCELLED"
                          ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border-red-500/20"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300"
                      }`}
                    >
                      {sub.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{formatDate(sub.startDate)}</td>
                  <td className="px-5 py-3.5 text-slate-500">{formatDate(sub.renewalDate)}</td>
                  <td className="px-5 py-3.5 text-right">
                    {sub.status === "ACTIVE" && (
                      <button
                        onClick={() => setCancellingSubId(sub.id)}
                        className="text-red-600 hover:text-red-700 font-semibold text-xs"
                      >
                        Cancel
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 2. Invoices Tab */}
      {activeTab === "invoices" && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3">Invoice #</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Due Date</th>
                <th className="px-5 py-3">Paid Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customer.invoices?.map((inv: any) => (
                <tr key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                    {inv.invoiceNumber}
                  </td>
                  <td className="px-5 py-3.5 font-medium">{formatCurrency(inv.amount)}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        inv.status === "PAID"
                          ? "bg-green-50 dark:bg-green-950/40 text-green-600 border-green-500/20"
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
        </div>
      )}

      {/* 3. Billing Payment Events Tab */}
      {activeTab === "billing" && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3">Event Type</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Idempotency Key</th>
                <th className="px-5 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customer.billingEvents?.map((evt: any) => (
                <tr key={evt.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                    {evt.eventType}
                  </td>
                  <td className="px-5 py-3.5 font-medium">{formatCurrency(evt.amount)}</td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        evt.status === "SUCCESS"
                          ? "bg-green-50 dark:bg-green-950/40 text-green-600 border-green-500/20"
                          : evt.status === "REFUNDED"
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 border-amber-500/20"
                          : "bg-red-50 dark:bg-red-950/40 text-red-600 border-red-500/20"
                      }`}
                    >
                      {evt.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-mono text-[10px] text-slate-400 truncate max-w-xs">
                    {evt.idempotencyKey}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{formatDateTime(evt.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Usage Records Tab */}
      {activeTab === "usage" && (
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 uppercase font-semibold">
              <tr>
                <th className="px-5 py-3">Metric Type</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Recorded At</th>
                <th className="px-5 py-3">Notes & Alerts</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {customer.usageRecords?.map((u: any) => (
                <tr key={u.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                    {u.metricType}
                  </td>
                  <td className="px-5 py-3.5 font-bold text-indigo-600 dark:text-indigo-400">
                    {formatNumber(u.amount)}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">{formatDateTime(u.recordedAt)}</td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {u.notes ? (
                      <span className="text-amber-600 dark:text-amber-400 font-medium">{u.notes}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              Edit Customer Profile
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Update organization contact or account state.
            </p>

            <form onSubmit={handleUpdateCustomer} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Company Name
                </label>
                <input
                  type="text"
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Account Status
                </label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="CHURNED">CHURNED</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
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
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CANCEL CONFIRMATION DIALOG */}
      {cancellingSubId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Cancel Active Subscription?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              This will set the status to CANCELLED and preserve all historical billing and usage records in the database.
            </p>
            <div className="flex justify-end space-x-3 mt-6 text-xs">
              <button
                type="button"
                onClick={() => setCancellingSubId(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium"
              >
                Keep Active
              </button>
              <button
                type="button"
                onClick={() => handleCancelSubscription(cancellingSubId)}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

