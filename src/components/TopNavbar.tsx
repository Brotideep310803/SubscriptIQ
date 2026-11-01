"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Menu,
  Sun,
  Moon,
  Search,
  ShieldCheck,
  Check,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastProvider";

export function TopNavbar({ onMenuClick }: { onMenuClick: () => void }) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  // Derive title from pathname
  const pathParts = pathname.split("/").filter(Boolean);
  const currentTitle =
    pathParts.length > 0
      ? pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1)
      : "Dashboard";

  const handleQuickSwitch = async (email: string, pass: string, roleName: string) => {
    setIsSwitching(true);
    setRoleMenuOpen(false);
    const res = await login(email, pass);
    setIsSwitching(false);
    if (res.success) {
      toast.success(`Switched role to ${roleName}`);
      window.location.reload();
    } else {
      toast.error(res.error || "Failed to switch role");
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md flex items-center justify-between px-4 lg:px-8">
      {/* Left section: Mobile menu + Page Title / Breadcrumbs */}
      <div className="flex items-center space-x-3">
        <button
          onClick={onMenuClick}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white lg:hidden hover:bg-slate-100 dark:hover:bg-slate-900"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-2 text-sm">
          <span className="text-slate-400 dark:text-slate-500">SubscriptIQ</span>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <h1 className="font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
            {currentTitle === "Audit-logs" ? "Audit Trail" : currentTitle}
          </h1>
        </div>
      </div>

      {/* Right section: Quick Role Switcher + Dark mode toggle */}
      <div className="flex items-center space-x-3">
        {/* Quick RBAC Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            disabled={isSwitching}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Role:</span>
            <span className="font-semibold text-indigo-600 dark:text-indigo-400">
              {user?.role?.replace("_", " ") || "Select"}
            </span>
            <ChevronDown className="w-3 h-3 text-slate-400" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl p-2 z-50 text-xs">
              <div className="px-2 py-1.5 font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                Switch Demo Persona (RBAC)
              </div>

              <button
                onClick={() => handleQuickSwitch("admin@subscriptiq.com", "Admin123!", "Admin")}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-purple-600 dark:text-purple-400">Admin (Full Access)</div>
                  <div className="text-[11px] text-slate-400">Manage plans, billing, all reports</div>
                </div>
                {user?.role === "ADMIN" && <Check className="w-4 h-4 text-purple-500" />}
              </button>

              <button
                onClick={() => handleQuickSwitch("manager@subscriptiq.com", "Manager123!", "Manager")}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-blue-600 dark:text-blue-400">Manager</div>
                  <div className="text-[11px] text-slate-400">Analytics, customers, subscriptions</div>
                </div>
                {user?.role === "MANAGER" && <Check className="w-4 h-4 text-blue-500" />}
              </button>

              <button
                onClick={() => handleQuickSwitch("support@subscriptiq.com", "Support123!", "Support Agent")}
                className="w-full text-left px-2.5 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="font-semibold text-emerald-600 dark:text-emerald-400">Support Agent</div>
                  <div className="text-[11px] text-slate-400">View customer & billing data only</div>
                </div>
                {user?.role === "SUPPORT_AGENT" && <Check className="w-4 h-4 text-emerald-500" />}
              </button>
            </div>
          )}
        </div>

        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          aria-label="Toggle theme"
          className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
        </button>
      </div>
    </header>
  );
}

