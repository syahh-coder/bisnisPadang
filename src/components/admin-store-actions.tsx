"use client";

import { useTransition } from "react";
import { deleteStore, clearAllStoresAction, loadSampleStoresAction } from "@/app/portal/admin/actions";
import { Icon } from "@/components/icon";
import { useDialog } from "@/components/dialog";
import { useToast } from "@/components/toast";

export function DeleteStoreButton({ storeId, storeName }: { storeId: string; storeName: string }) {
  const { confirm } = useDialog();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleClick = async () => {
    const ok = await confirm({
      title: `Hapus Toko "${storeName}"?`,
      message: `Data toko "${storeName}" beserta seluruh menu dan riwayat transaksinya akan dihapus secara permanen dari sistem.`,
      confirmText: "Ya, Hapus Toko",
      cancelText: "Batal",
      variant: "danger",
      icon: "trash",
    });

    if (ok) {
      startTransition(async () => {
        try {
          await deleteStore(storeId);
          toast(`Toko "${storeName}" berhasil dihapus`, "success");
        } catch {
          toast("Gagal menghapus toko. Coba lagi.", "error");
        }
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      title={`Hapus toko ${storeName}`}
      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 text-xs font-semibold transition-all cursor-pointer disabled:opacity-50"
    >
      <Icon name="trash" size={13} className="text-rose-600" />
      <span>{isPending ? "Menghapus..." : "Hapus"}</span>
    </button>
  );
}

export function CatalogResetControls({ storeCount }: { storeCount: number }) {
  const { confirm } = useDialog();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const handleClearAll = async () => {
    const ok = await confirm({
      title: "Kosongkan Semua Toko?",
      message: "Seluruh data toko di katalog akan dibersihkan. Kamu dapat memulihkan 5 data toko contoh kapan saja melalui tombol 'Muat 5 Toko Contoh'.",
      confirmText: "Ya, Kosongkan Semua",
      cancelText: "Batal",
      variant: "danger",
      icon: "trash",
    });

    if (ok) {
      startTransition(async () => {
        try {
          await clearAllStoresAction();
          toast("Semua toko berhasil dikosongkan dari katalog.", "info");
        } catch {
          toast("Gagal mengosongkan toko.", "error");
        }
      });
    }
  };

  const handleLoadSample = async () => {
    const ok = await confirm({
      title: "Muat Data Toko Contoh?",
      message: "Sistem akan menambahkan 5 toko contoh rekomendasi (kuliner, kedai kopi, laundry, dan sembako) lengkap dengan menu dan koordinat lokasi.",
      confirmText: "Muat Sekarang",
      cancelText: "Batal",
      variant: "info",
      icon: "sparkles",
    });

    if (ok) {
      startTransition(async () => {
        try {
          await loadSampleStoresAction();
          toast("5 toko contoh berhasil dimuat ke katalog!", "success");
        } catch {
          toast("Gagal memuat toko contoh.", "error");
        }
      });
    }
  };

  if (storeCount > 0) {
    return (
      <button
        type="button"
        onClick={handleClearAll}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50/60 hover:bg-rose-100/80 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
      >
        <Icon name="trash" size={14} />
        <span>{isPending ? "Memproses..." : "Kosongkan Semua Toko"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleLoadSample}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-200 text-teal-800 bg-teal-50 hover:bg-teal-100 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
    >
      <Icon name="sparkles" size={14} />
      <span>{isPending ? "Memuat..." : "Muat 5 Toko Contoh"}</span>
    </button>
  );
}
