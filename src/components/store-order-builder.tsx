"use client";

import { useState } from "react";
import { ProductThumbnail } from "@/components/product-thumbnail";
import { Icon } from "@/components/icon";

export interface OrderProduct {
  id: string;
  name: string;
  price: number | string;
  photo_path: string | null;
  photo_url?: string | null;
  sort_order: number;
}

interface StoreOrderBuilderProps {
  products: OrderProduct[];
  storeName: string;
  storePhone: string;
  whatsappUrl: string | null;
}

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function StoreOrderBuilder({
  products,
  storeName,
  whatsappUrl,
}: StoreOrderBuilderProps) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");

  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: current - 1 };
    });
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = products.find((item) => item.id === id);
    return sum + (Number(p?.price) || 0) * qty;
  }, 0);

  const handleCheckoutWA = () => {
    if (!whatsappUrl) {
      alert("Nomor WhatsApp toko belum tersedia.");
      return;
    }

    const itemsText = Object.entries(cart)
      .map(([id, qty]) => {
        const p = products.find((item) => item.id === id);
        return `• ${qty}x ${p?.name} (${rupiah.format((Number(p?.price) || 0) * qty)})`;
      })
      .join("\n");

    const message = `Halo ${storeName},\nsaya ingin memesan dari Toko Lokal Padang:\n\n${itemsText}\n\n*Total Pesanan:* ${rupiah.format(
      totalPrice
    )}${customerName ? `\n*Nama Pemesan:* ${customerName}` : ""}${
      customerAddress ? `\n*Alamat Kirim:* ${customerAddress}` : ""
    }\n\nMohon konfirmasi pesanan dan ketersediaan menu. Terima kasih!`;

    const encoded = encodeURIComponent(message);
    const cleanNumber = whatsappUrl.replace(/[^0-9]/g, "");
    window.open(`https://wa.me/${cleanNumber}?text=${encoded}`, "_blank");
  };

  if (products.length === 0) {
    return (
      <div className="py-8 text-center text-slate-400 text-sm">
        Belum ada menu atau produk yang ditampilkan oleh toko ini.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-label="Menu dan produk toko">
        {products.map((product) => {
          const qty = cart[product.id] || 0;
          const displayPhoto = product.photo_url || (product.photo_path?.startsWith("http") ? product.photo_path : null);

          return (
            <li
              key={product.id}
              className="flex items-center justify-between gap-3 p-3.5 bg-white rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-xs transition-all"
            >
              <div className="flex items-center gap-3 min-w-0">
                <ProductThumbnail src={displayPhoto} name={product.name} />
                <div className="min-w-0">
                  <h4 className="font-semibold text-slate-900 text-sm truncate">{product.name}</h4>
                  <p className="text-xs font-bold text-teal-800 mt-0.5">
                    {rupiah.format(Number(product.price))}
                  </p>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-1.5">
                {qty > 0 ? (
                  <div className="flex items-center bg-slate-100 rounded-xl p-1 gap-1">
                    <button
                      type="button"
                      onClick={() => removeFromCart(product.id)}
                      className="w-7 h-7 rounded-lg bg-white shadow-xs text-slate-700 hover:bg-slate-50 flex items-center justify-center font-bold text-xs"
                      aria-label="Kurangi pesanan"
                    >
                      <Icon name="minus" size={14} />
                    </button>
                    <span className="w-6 text-center font-bold text-xs text-slate-900">{qty}</span>
                    <button
                      type="button"
                      onClick={() => addToCart(product.id)}
                      className="w-7 h-7 rounded-lg bg-teal-700 shadow-xs text-white hover:bg-teal-800 flex items-center justify-center font-bold text-xs"
                      aria-label="Tambah pesanan"
                    >
                      <Icon name="plus" size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => addToCart(product.id)}
                    className="px-3 py-1.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold text-xs transition-colors flex items-center gap-1"
                  >
                    <Icon name="plus" size={14} />
                    <span>Pesan</span>
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Floating Bottom Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-40 animate-fade-in">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-700 flex items-center justify-between gap-3 backdrop-blur-md">
            <div>
              <p className="text-xs text-slate-400 font-medium">
                <span className="text-teal-400 font-bold">{totalItems}</span> menu dipilih
              </p>
              <p className="text-base font-extrabold text-white">{rupiah.format(totalPrice)}</p>
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 active:scale-95 text-white font-bold text-xs shadow-md flex items-center gap-1.5 transition-all"
            >
              <Icon name="chat" size={16} />
              <span>Kirim ke WA</span>
            </button>
          </div>
        </div>
      )}

      {/* Checkout Drawer Modal */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fade-in"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                  <Icon name="shoppingBag" size={18} />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Ringkasan Pesanan</h3>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {Object.entries(cart).map(([id, qty]) => {
                const item = products.find((p) => p.id === id);
                return (
                  <div key={id} className="flex justify-between items-center text-xs py-1.5 border-b border-slate-50">
                    <span className="font-medium text-slate-800 truncate mr-2">
                      {qty}x {item?.name}
                    </span>
                    <span className="font-bold text-slate-900 shrink-0">
                      {rupiah.format((Number(item?.price) || 0) * qty)}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500">Total Pembayaran:</span>
              <span className="text-base font-extrabold text-teal-800">{rupiah.format(totalPrice)}</span>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="cust-name">
                  Nama Anda (opsional)
                </label>
                <input
                  id="cust-name"
                  type="text"
                  placeholder="Contoh: Rahmat"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="cust-addr">
                  Alamat Kirim (opsional)
                </label>
                <textarea
                  id="cust-addr"
                  rows={2}
                  placeholder="Jl. Perintis Kemerdekaan No. 12..."
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckoutWA}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              <Icon name="chat" size={18} />
              <span>Kirim Pesanan ke WhatsApp</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
