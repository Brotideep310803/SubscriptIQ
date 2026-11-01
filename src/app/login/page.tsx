"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthContext";
import { useToast } from "@/components/ToastProvider";
import {
  TrendingUp,
  Shield,
  Briefcase,
  Headphones,
  ArrowRight,
  Lock,
  Mail,
  Loader2,
  CheckCircle,
} from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [demoSelected, setDemoSelected] = useState<string | null>(null);

  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please enter both email and password.");
      return;
    }

    setSubmitting(true);
    const res = await login(email, password);
    setSubmitting(false);

    if (res.success) {
      toast.success("Welcome back to SubscriptIQ!");
      router.push("/dashboard");
    } else {
      toast.error(res.error || "Authentication failed.");
    }
  };

  const handleQuickDemoLogin = async (
    demoEmail: string,
    demoPass: string,
    roleTitle: string
  ) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setDemoSelected(roleTitle);
    setSubmitting(true);

    const res = await login(demoEmail, demoPass);
    setSubmitting(false);

    if (res.success) {
      toast.success(`Signed in as ${roleTitle}!`);
      router.push("/dashboard");
    } else {
      toast.error(res.error || "Failed to sign in.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-800 dark:text-slate-100">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-blue-500 text-white shadow-xl shadow-indigo-500/25 mb-4">
          <TrendingUp className="w-8 h-8" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight">
          Subscript<span className="text-indigo-600 dark:text-indigo-400">IQ</span>
        </h2>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          Enterprise Subscription Analytics & Operations SaaS
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white dark:bg-slate-900 py-8 px-6 sm:px-10 shadow-2xl shadow-slate-200/50 dark:shadow-black/40 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          {/* Quick Demo Accounts Selection */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                1-Click Demo Evaluation Accounts
              </span>
              <span className="text-[11px] bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-medium px-2 py-0.5 rounded-full border border-indigo-200/60 dark:border-indigo-800">
                RBAC Ready
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Admin Card */}
              <button
                type="button"
                onClick={() =>
                  handleQuickDemoLogin("admin@subscriptiq.com", "Admin123!", "Admin")
                }
                disabled={submitting}
                className="group relative text-left p-3 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/40 dark:bg-purple-950/20 hover:border-purple-400 dark:hover:border-purple-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase">
                      Admin
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                    Alexandra Vance
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Full SaaS access & billing</div>
                </div>
                <div className="mt-3 text-[11px] font-semibold text-purple-600 dark:text-purple-400 flex items-center group-hover:translate-x-1 transition-transform">
                  Sign in <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </button>

              {/* Manager Card */}
              <button
                type="button"
                onClick={() =>
                  handleQuickDemoLogin("manager@subscriptiq.com", "Manager123!", "Manager")
                }
                disabled={submitting}
                className="group relative text-left p-3 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 hover:border-blue-400 dark:hover:border-blue-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Briefcase className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase">
                      Manager
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                    Marcus Reynolds
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Analytics & customer ops</div>
                </div>
                <div className="mt-3 text-[11px] font-semibold text-blue-600 dark:text-blue-400 flex items-center group-hover:translate-x-1 transition-transform">
                  Sign in <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </button>

              {/* Support Agent Card */}
              <button
                type="button"
                onClick={() =>
                  handleQuickDemoLogin(
                    "support@subscriptiq.com",
                    "Support123!",
                    "Support Agent"
                  )
                }
                disabled={submitting}
                className="group relative text-left p-3 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-400 dark:hover:border-emerald-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <Headphones className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 uppercase">
                      Support
                    </span>
                  </div>
                  <div className="font-semibold text-xs text-slate-800 dark:text-slate-100">
                    Elena Rostova
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">Customers & billing history</div>
                </div>
                <div className="mt-3 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center group-hover:translate-x-1 transition-transform">
                  Sign in <ArrowRight className="w-3 h-3 ml-1" />
                </div>
              </button>
            </div>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-slate-900 px-3 text-slate-400 font-medium">
                Or sign in manually
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm shadow-md shadow-indigo-600/20 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors flex items-center justify-center space-x-2"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in...</span>
                </>
              ) : (
                <span>Sign in to Dashboard</span>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
            SubscriptIQ • Production-style Subscription Analytics SaaS MVP
          </div>
        </div>
      </div>
    </div>
  );
}

