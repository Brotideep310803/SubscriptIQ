"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Plus,
  Check,
  Edit2,
  Trash2,
  AlertCircle,
  Search,
  CheckCircle2,
  XCircle,
  Loader2,
  Lock,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/utils";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/components/ToastProvider";

export default function PlansPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const isAdmin = user?.role === "ADMIN";

  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formMonthlyPrice, setFormMonthlyPrice] = useState<number>(49);
  const [formAnnualPrice, setFormAnnualPrice] = useState<number>(490);
  const [formBillingInterval, setFormBillingInterval] = useState("MONTHLY");
  const [formFeatures, setFormFeatures] = useState("");
  const [formMaxUsageLimit, setFormMaxUsageLimit] = useState<number>(10000);
  const [formStatus, setFormStatus] = useState("ACTIVE");

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/plans?status=${statusFilter}&search=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const data = await res.json();
        setPlans(data.plans || []);
      }
    } catch {
      toast.error("Failed to load subscription plans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, [statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlans();
  };

  const openCreateModal = () => {
    setFormName("");
    setFormDescription("");
    setFormMonthlyPrice(49);
    setFormAnnualPrice(490);
    setFormBillingInterval("MONTHLY");
    setFormFeatures("5 Team Seats\n10,000 Monthly API Calls\nCommunity Support\nStandard Analytics");
    setFormMaxUsageLimit(10000);
    setFormStatus("ACTIVE");
    setShowCreateModal(true);
  };

  const openEditModal = (p: any) => {
    setEditingPlan(p);
    setFormName(p.name);
    setFormDescription(p.description);
    setFormMonthlyPrice(p.monthlyPrice);
    setFormAnnualPrice(p.annualPrice);
    setFormBillingInterval(p.billingInterval);
    setFormFeatures(p.featuresList ? p.featuresList.join("\n") : "");
    setFormMaxUsageLimit(p.maxUsageLimit);
    setFormStatus(p.status);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      toast.error("Only Administrators can modify subscription tiers.");
      return;
    }

    setSubmitting(true);
    const featuresArray = formFeatures
      .split("\n")
      .map((f) => f.trim())
      .filter(Boolean);

    const payload = {
      name: formName,
      description: formDescription,
      monthlyPrice: Number(formMonthlyPrice),
      annualPrice: Number(formAnnualPrice),
      billingInterval: formBillingInterval,
      features: featuresArray,
      maxUsageLimit: Number(formMaxUsageLimit),
      status: formStatus,
    };

    try {
      const url = editingPlan ? `/api/plans/${editingPlan.id}` : "/api/plans";
      const method = editingPlan ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Operation failed");
      } else {
        toast.success(editingPlan ? "Plan updated successfully!" : "Plan created successfully!");
        setShowCreateModal(false);
        setEditingPlan(null);
        fetchPlans();
      }
    } catch {
      toast.error("Network error while saving plan");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async () => {
    if (!deletingPlan) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/plans/${deletingPlan.id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Failed to delete plan");
      } else {
        toast.success(`Plan '${deletingPlan.name}' deleted.`);
        setDeletingPlan(null);
        fetchPlans();
      }
    } catch {
      toast.error("Network error during plan deletion");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Subscription Plans
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Configure pricing tiers, limits, and feature entitlements.
          </p>
        </div>

        {isAdmin ? (
          <button
            onClick={openCreateModal}
            className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Plan</span>
          </button>
        ) : (
          <div className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs font-medium">
            <Lock className="w-3.5 h-3.5" />
            <span>Plan editing restricted to Admin</span>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search plan by name..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </form>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400">Status:</span>
          {["ALL", "ACTIVE", "ARCHIVED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition-colors ${
                statusFilter === st
                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-semibold"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="h-48 flex items-center justify-center text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin text-indigo-500 mr-2" />
          <span>Loading subscription plans...</span>
        </div>
      ) : plans.length === 0 ? (
        <div className="p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800">
          <Layers className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h3 className="font-semibold text-slate-800 dark:text-slate-200">No plans found</h3>
          <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`rounded-2xl border bg-white dark:bg-slate-900 p-6 flex flex-col justify-between shadow-xs transition-all hover:shadow-md ${
                p.status === "ACTIVE"
                  ? "border-slate-200/80 dark:border-slate-800"
                  : "border-dashed border-slate-300 dark:border-slate-800 opacity-75"
              }`}
            >
              <div>
                {/* Plan Header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center space-x-2">
                      <span>{p.name}</span>
                      {p.name === "Growth" && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                          Popular
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                      {p.description}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 border ${
                      p.status === "ACTIVE"
                        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 border-emerald-500/20"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-300"
                    }`}
                  >
                    {p.status}
                  </span>
                </div>

                {/* Price Display */}
                <div className="my-5 p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                  <div className="flex items-baseline space-x-1">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
                      {formatCurrency(p.monthlyPrice)}
                    </span>
                    <span className="text-xs text-slate-400">/ month</span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Annual: <span className="font-semibold">{formatCurrency(p.annualPrice)}/yr</span> (Save ~16%)
                  </div>
                  <div className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium mt-1">
                    Quota: {formatNumber(p.maxUsageLimit)} units/mo
                  </div>
                </div>

                {/* Features List */}
                <div className="space-y-2 mb-6">
                  <span className="text-[11px] font-semibold uppercase text-slate-400 tracking-wider">
                    Included Capabilities
                  </span>
                  {p.featuresList?.map((feat: string, idx: number) => (
                    <div key={idx} className="flex items-center text-xs text-slate-600 dark:text-slate-300">
                      <Check className="w-3.5 h-3.5 text-emerald-500 mr-2 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer: Subscriber count & Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {p.activeSubscriptionCount || 0}
                  </span>{" "}
                  subscribers
                </span>

                {isAdmin && (
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => openEditModal(p)}
                      title="Edit Plan"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeletingPlan(p)}
                      title="Delete Plan"
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {(showCreateModal || editingPlan) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
              {editingPlan ? `Edit '${editingPlan.name}' Plan` : "Create New Subscription Plan"}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Set billing metrics, usage limits, and customer features.
            </p>

            <form onSubmit={handleSavePlan} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Plan Name
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Scale Tier"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Target audience and plan summary..."
                  rows={2}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Monthly Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formMonthlyPrice}
                    onChange={(e) => setFormMonthlyPrice(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Annual Price ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formAnnualPrice}
                    onChange={(e) => setFormAnnualPrice(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Max Usage Limit (Units)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formMaxUsageLimit}
                    onChange={(e) => setFormMaxUsageLimit(Number(e.target.value))}
                    required
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Features (1 per line)
                </label>
                <textarea
                  value={formFeatures}
                  onChange={(e) => setFormFeatures(e.target.value)}
                  rows={4}
                  placeholder="Feature bullet 1&#10;Feature bullet 2"
                  required
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingPlan(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium shadow-sm flex items-center space-x-1.5"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingPlan ? "Save Changes" : "Create Plan"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION DIALOG (WITH DEPENDENCY CHECK) */}
      {deletingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 max-w-md w-full p-6 shadow-2xl">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mb-3">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Delete Plan: {deletingPlan.name}?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              Are you sure you want to permanently delete this plan? If any customers have active
              subscriptions attached, the backend will prevent deletion to preserve data integrity.
            </p>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                type="button"
                onClick={() => setDeletingPlan(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeletePlan}
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm flex items-center space-x-1.5"
              >
                {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

