"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Layers,
  Users,
  Repeat,
  Gauge,
  CreditCard,
  BarChart3,
  ShieldAlert,
  LogOut,
  ChevronRight,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import { useAuth } from "./AuthContext";

export function Sidebar({ mobileOpen, onClose }: { mobileOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: ["ADMIN", "MANAGER", "SUPPORT_AGENT"],
    },
    {
      name: "Plans",
      href: "/plans",
      icon: Layers,
      roles: ["ADMIN", "MANAGER", "SUPPORT_AGENT"],
    },
    {
      name: "Customers",
      href: "/customers",
      icon: Users,
      roles: ["ADMIN", "MANAGER", "SUPPORT_AGENT"],
    },
    {
      name: "Subscriptions",
      href: "/subscriptions",
      icon: Repeat,
      roles: ["ADMIN", "MANAGER", "SUPPORT_AGENT"],
    },
    {
      name: "Usage Tracking",
      href: "/usage",
      icon: Gauge,
      roles: ["ADMIN", "MANAGER", "SUPPORT_AGENT"],
    },
    {
      name: "Billing & Invoices",
      href: "/billing",
      icon: CreditCard,
      roles: ["ADMIN", "MANAGER", "SUPPORT_AGENT"],
    },
    {
      name: "Analytics & Reports",
      href: "/analytics",
      icon: BarChart3,
      roles: ["ADMIN", "MANAGER"], // Manager & Admin only
    },
    {
      name: "Audit Trail",
      href: "/audit-logs",
      icon: ShieldAlert,
      roles: ["ADMIN", "MANAGER"], // Manager & Admin only
    },
  ];

  const filteredNav = navItems.filter((item) => !user || item.roles.includes(user.role));

  const roleBadgeColor = {
    ADMIN: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
    MANAGER: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    SUPPORT_AGENT: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  }[user?.role || "SUPPORT_AGENT"];

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 flex items-center border-b border-slate-100 dark:border-slate-800/80">
          <Link href="/dashboard" className="flex items-center space-x-3 group" onClick={onClose}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Subscript<span className="text-indigo-600 dark:text-indigo-400">IQ</span>
              </span>
              <span className="block text-[10px] text-slate-400 dark:text-slate-500 font-medium uppercase tracking-wider">
                Analytics SaaS MVP
              </span>
            </div>
          </Link>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Workspace
          </div>
          {filteredNav.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-semibold"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-900/60"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? "text-indigo-600 dark:text-indigo-400"
                        : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                    }`}
                  />
                  <span>{item.name}</span>
                </div>
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-500" />}
              </Link>
            );
          })}
        </div>

        {/* User Profile & Role Status */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/30">
          <div className="p-2.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.name ? user.name.split(" ").map((n) => n[0]).join("") : "U"}
                </div>
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {user?.name || "Loading..."}
                  </p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>
              </div>
              <button
                onClick={() => logout()}
                title="Sign out"
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[10px] text-slate-400">Current Role:</span>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${roleBadgeColor}`}
              >
                {user?.role?.replace("_", " ") || "USER"}
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
