"use client";

import { useState, useEffect } from "react";
import { Icon, type IconName } from "@/components/icon";

type NoticeType = "info" | "warning" | "success" | "error";

interface NoticeBannerProps {
  id?: string;
  type?: NoticeType;
  title?: string;
  children: React.ReactNode;
  dismissible?: boolean;
  storageKey?: string;
  className?: string;
}

export function NoticeBanner({
  type = "info",
  title,
  children,
  dismissible = true,
  storageKey,
  className = "",
}: NoticeBannerProps) {
  const [visible, setVisible] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (storageKey && typeof window !== "undefined") {
      const isDismissed = sessionStorage.getItem(`notice_${storageKey}`);
      if (isDismissed === "true") {
        setVisible(false);
      }
    }
  }, [storageKey]);

  if (!visible) return null;

  const handleDismiss = () => {
    setVisible(false);
    if (storageKey && typeof window !== "undefined") {
      sessionStorage.setItem(`notice_${storageKey}`, "true");
    }
  };

  const icons: Record<NoticeType, IconName> = {
    info: "info",
    warning: "alertCircle",
    success: "check",
    error: "alertCircle",
  };

  const styleClasses: Record<NoticeType, string> = {
    info: "bg-teal-50/80 border-teal-200 text-teal-900 dark:bg-teal-950/40 dark:border-teal-800 dark:text-teal-100",
    warning: "bg-amber-50/90 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-100",
    success: "bg-emerald-50/90 border-emerald-200 text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-100",
    error: "bg-rose-50/90 border-rose-200 text-rose-900 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-100",
  };

  return (
    <aside
      className={`notice-banner group relative flex items-start gap-3 p-4 rounded-xl border shadow-sm transition-all duration-300 ease-out mb-5 ${styleClasses[type]} ${className}`}
      role="status"
    >
      <div className="shrink-0 mt-0.5 opacity-90">
        <Icon name={icons[type]} size={20} />
      </div>
      <div className="flex-1 min-w-0 text-sm leading-relaxed">
        {title && <p className="font-semibold mb-0.5">{title}</p>}
        <div className="text-sm opacity-90">{children}</div>
      </div>
      {dismissible && (
        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 -mr-1 -mt-1 p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500"
          aria-label="Tutup notifikasi"
          title="Tutup notifikasi"
        >
          <Icon name="close" size={16} />
        </button>
      )}
    </aside>
  );
}
