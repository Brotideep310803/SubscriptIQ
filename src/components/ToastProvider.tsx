"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

export interface ToastItem {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastContextType {
  toast: {
    success: (msg: string) => void;
    error: (msg: string) => void;
    info: (msg: string) => void;
  };
}

const ToastContext = createContext<ToastContextType>({
  toast: {
    success: () => {},
    error: () => {},
    info: () => {},
  },
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toastMethods = {
    success: (msg: string) => addToast("success", msg),
    error: (msg: string) => addToast("error", msg),
    info: (msg: string) => addToast("info", msg),
  };

  return (
    <ToastContext.Provider value={{ toast: toastMethods }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center space-x-3 px-4 py-3 rounded-lg shadow-lg border text-sm font-medium transition-all transform translate-y-0 opacity-100 ${
              t.type === "success"
                ? "bg-white dark:bg-slate-900 border-green-500/30 text-green-700 dark:text-green-400"
                : t.type === "error"
                ? "bg-white dark:bg-slate-900 border-red-500/30 text-red-700 dark:text-red-400"
                : "bg-white dark:bg-slate-900 border-blue-500/30 text-blue-700 dark:text-blue-400"
            }`}
          >
            {t.type === "success" && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
            {t.type === "error" && <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />}
            {t.type === "info" && <Info className="w-5 h-5 text-blue-500 shrink-0" />}
            <span className="flex-1 text-slate-800 dark:text-slate-200">{t.message}</span>
            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);

