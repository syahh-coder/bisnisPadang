"use client";

import { createContext, useContext, useState, useCallback, useEffect, useRef, ReactNode } from "react";
import { Icon, type IconName } from "@/components/icon";

export type DialogVariant = "danger" | "warning" | "info" | "success";

export interface DialogOptions {
  title: string;
  message: string | ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: DialogVariant;
  icon?: IconName;
}

interface ActiveDialog extends DialogOptions {
  id: string;
  isConfirm: boolean;
  resolve: (value: boolean) => void;
}

interface DialogContextType {
  confirm: (options: DialogOptions | string) => Promise<boolean>;
  alert: (options: DialogOptions | string) => Promise<void>;
  closeDialog: () => void;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

// Imperative global bridge so functions outside hooks can trigger dialogs
let globalConfirmHandler: ((options: DialogOptions | string) => Promise<boolean>) | null = null;
let globalAlertHandler: ((options: DialogOptions | string) => Promise<void>) | null = null;

export function showConfirm(options: DialogOptions | string): Promise<boolean> {
  if (globalConfirmHandler) return globalConfirmHandler(options);
  if (typeof window !== "undefined") {
    console.warn("[DialogProvider unmounted] showConfirm called:", options);
  }
  return Promise.resolve(true);
}

export function showAlert(options: DialogOptions | string): Promise<void> {
  if (globalAlertHandler) return globalAlertHandler(options);
  if (typeof window !== "undefined") {
    console.warn("[DialogProvider unmounted] showAlert called:", options);
  }
  return Promise.resolve();
}

const variantStyles: Record<
  DialogVariant,
  {
    icon: IconName;
    iconBg: string;
    iconColor: string;
    confirmButton: string;
  }
> = {
  danger: {
    icon: "trash",
    iconBg: "bg-rose-100",
    iconColor: "text-rose-600",
    confirmButton: "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20",
  },
  warning: {
    icon: "alertCircle",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
    confirmButton: "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/20",
  },
  info: {
    icon: "info",
    iconBg: "bg-teal-100",
    iconColor: "text-teal-800",
    confirmButton: "bg-teal-700 hover:bg-teal-800 text-white shadow-teal-700/20",
  },
  success: {
    icon: "check",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
    confirmButton: "bg-emerald-700 hover:bg-emerald-800 text-white shadow-emerald-700/20",
  },
};

export function DialogProvider({ children }: { children: ReactNode }) {
  const [activeDialog, setActiveDialog] = useState<ActiveDialog | null>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  const closeDialog = useCallback(() => {
    if (activeDialog) {
      activeDialog.resolve(false);
      setActiveDialog(null);
    }
  }, [activeDialog]);

  const confirm = useCallback((options: DialogOptions | string): Promise<boolean> => {
    const opts: DialogOptions =
      typeof options === "string"
        ? { title: "Konfirmasi", message: options, variant: "info" }
        : options;

    return new Promise<boolean>((resolve) => {
      setActiveDialog({
        ...opts,
        id: Math.random().toString(36).substring(2, 9),
        isConfirm: true,
        resolve,
      });
    });
  }, []);

  const alert = useCallback((options: DialogOptions | string): Promise<void> => {
    const opts: DialogOptions =
      typeof options === "string"
        ? { title: "Pemberitahuan", message: options, variant: "info" }
        : options;

    return new Promise<void>((resolve) => {
      setActiveDialog({
        ...opts,
        id: Math.random().toString(36).substring(2, 9),
        isConfirm: false,
        resolve: () => resolve(),
      });
    });
  }, []);

  // Register handlers to global bridge
  useEffect(() => {
    globalConfirmHandler = confirm;
    globalAlertHandler = alert;
    return () => {
      globalConfirmHandler = null;
      globalAlertHandler = null;
    };
  }, [confirm, alert]);

  // Focus trap / auto-focus on confirm button when dialog opens
  useEffect(() => {
    if (activeDialog) {
      const timer = setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
          e.preventDefault();
          closeDialog();
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("keydown", handleKeyDown);
      };
    }
  }, [activeDialog, closeDialog]);

  const handleConfirm = () => {
    if (activeDialog) {
      activeDialog.resolve(true);
      setActiveDialog(null);
    }
  };

  const handleCancel = () => {
    if (activeDialog) {
      activeDialog.resolve(false);
      setActiveDialog(null);
    }
  };

  const variant = activeDialog?.variant || "info";
  const styles = variantStyles[variant];
  const displayIcon = activeDialog?.icon || styles.icon;

  return (
    <DialogContext.Provider value={{ confirm, alert, closeDialog }}>
      {children}

      {/* Modal Popup Overlay */}
      {activeDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/65 backdrop-blur-xs animate-modal-backdrop"
          onClick={handleCancel}
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-title"
          aria-describedby="dialog-description"
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200/90 relative overflow-hidden animate-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Close Button */}
            <button
              type="button"
              onClick={handleCancel}
              className="absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Tutup popup"
            >
              <Icon name="close" size={16} />
            </button>

            {/* Icon Badge */}
            <div
              className={`w-12 h-12 rounded-2xl ${styles.iconBg} ${styles.iconColor} flex items-center justify-center mb-4 shadow-2xs`}
            >
              <Icon name={displayIcon} size={24} />
            </div>

            {/* Content */}
            <h3
              id="dialog-title"
              className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight leading-snug"
            >
              {activeDialog.title}
            </h3>

            <div
              id="dialog-description"
              className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-2.5 whitespace-pre-line"
            >
              {activeDialog.message}
            </div>

            {/* Actions */}
            <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              {activeDialog.isConfirm && (
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors"
                >
                  {activeDialog.cancelText || "Batal"}
                </button>
              )}

              <button
                ref={confirmBtnRef}
                type="button"
                onClick={handleConfirm}
                className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold shadow-md active:scale-95 transition-all ${styles.confirmButton}`}
              >
                {activeDialog.confirmText || (activeDialog.isConfirm ? "Lanjutkan" : "Mengerti")}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) {
    return {
      confirm: (options: DialogOptions | string) => showConfirm(options),
      alert: (options: DialogOptions | string) => showAlert(options),
      closeDialog: () => {},
    };
  }
  return context;
}
