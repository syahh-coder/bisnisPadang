"use client";

import { deleteStore, clearAllStoresAction, loadSampleStoresAction } from "@/app/portal/admin/actions";
import { Icon } from "@/components/icon";

export function DeleteStoreButton({ storeId, storeName }: { storeId: string; storeName: string }) {
  return (
    <form
      action={async () => {
        await deleteStore(storeId);
      }}
      onSubmit={(e) => {
        if (typeof window !== "undefined" && !window.confirm(`Hapus toko "${storeName}"?\nData toko akan dihapus dari sistem.`)) {
          e.preventDefault();
        }
      }}
    >
      <button
        type="submit"
        title={`Hapus toko ${storeName}`}
        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 hover:border-rose-300 text-xs font-semibold transition-all cursor-pointer"
      >
        <Icon name="trash" size={13} className="text-rose-600" />
        <span>Hapus</span>
      </button>
    </form>
  );
}

export function CatalogResetControls({ storeCount }: { storeCount: number }) {
  if (storeCount > 0) {
    return (
      <form
        action={async () => {
          await clearAllStoresAction();
        }}
        onSubmit={(e) => {
          if (typeof window !== "undefined" && !window.confirm("Kosongkan semua toko sekarang?\nKatalog akan bersih tanpa data toko.")) {
            e.preventDefault();
          }
        }}
      >
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50/60 hover:bg-rose-100/80 text-xs font-semibold transition-colors cursor-pointer"
        >
          <Icon name="trash" size={14} />
          <span>Kosongkan Semua Toko</span>
        </button>
      </form>
    );
  }

  return (
    <form
      action={async () => {
        await loadSampleStoresAction();
      }}
    >
      <button
        type="submit"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-teal-200 text-teal-800 bg-teal-50 hover:bg-teal-100 text-xs font-semibold transition-colors cursor-pointer"
      >
        <Icon name="sparkles" size={14} />
        <span>Muat 5 Toko Contoh</span>
      </button>
    </form>
  );
}
