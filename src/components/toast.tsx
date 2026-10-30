"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  const icons: Record<ToastType, IconName> = {
    success: "check",
    error: "alertCircle",
    info: "info",
  };

  const bgStyles: Record<ToastType, string> = {
    success: "bg-emerald-600 text-white",
    error: "bg-rose-600 text-white",
    info: "bg-slate-900 text-white",
  };

  return (
    <ToastContext.Provider value={{ toast, removeToast }}>
      {children}
      <div
        className="fixed bottom-24 sm:bottom-6 right-4 sm:right-6 z-50 flex flex-col gap-2.5 max-w-sm pointer-events-none"
        aria-live="polite"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl backdrop-blur-md animate-toast-in ${bgStyles[t.type]}`}
            role="status"
          >
            <div className="shrink-0">
              <Icon name={icons[t.type]} size={18} />
            </div>
            <p className="text-sm font-medium flex-1">{t.message}</p>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="p-1 rounded-md opacity-70 hover:opacity-100 hover:bg-white/20 transition-colors"
              aria-label="Tutup notifikasi"
            >
              <Icon name="close" size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return fallback noop if outside provider
    return {
      toast: (msg: string) => {
        if (typeof window !== "undefined") alert(msg);
      },
      removeToast: () => {},
    };
  }
  return context;
}
