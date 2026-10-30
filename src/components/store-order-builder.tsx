"use client";

import { useState } from "react";
import { ProductThumbnail } from "@/components/product-thumbnail";
import { Icon } from "@/components/icon";
import { useLocation } from "@/components/location-context";
import { useDialog } from "@/components/dialog";

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
  storeAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
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
  storeAddress,
  latitude,
  longitude,
}: StoreOrderBuilderProps) {
  const [cart, setCart] = useState<Record<string, number>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orderMethod, setOrderMethod] = useState<"delivery" | "pickup">("delivery");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [orderNotes, setOrderNotes] = useState("");

  const { getDistanceTo } = useLocation();
  const { alert: dialogAlert } = useDialog();
  const distance = getDistanceTo(latitude, longitude);

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
      dialogAlert({
        title: "Nomor WhatsApp Belum Tersedia",
        message: "Toko ini belum menyertakan kontak WhatsApp aktif. Silakan kunjungi alamat toko langsung atau cek info pada ulasan Google Maps.",
        variant: "warning",
        confirmText: "Mengerti",
      });
      return;
    }

    const itemsText = Object.entries(cart)
      .map(([id, qty]) => {
        const p = products.find((item) => item.id === id);
        return `• ${qty}x ${p?.name} (${rupiah.format((Number(p?.price) || 0) * qty)})`;
      })
      .join("\n");

    const methodText = orderMethod === "delivery" ? "🛵 Antar ke Alamat (Delivery)" : "🏪 Ambil Sendiri di Toko (Pickup / Takeaway)";

    const message = [
      `Halo ${storeName},`,
      `Saya ingin memesan via Toko Lokal:`,
      ``,
      `*Daftar Pesanan:*`,
      itemsText,
      ``,
      `*Subtotal Pesanan:* ${rupiah.format(totalPrice)}`,
      `*Metode Pengambilan:* ${methodText}`,
      customerName ? `*Nama Pemesan:* ${customerName}` : null,
      orderMethod === "delivery" && customerAddress ? `*Alamat Pengiriman:* ${customerAddress}` : null,
      distance ? `*Jarak dari Toko:* ± ${distance}` : null,
      orderNotes ? `*Catatan Tambahan:* ${orderNotes}` : null,
      ``,
      `Mohon konfirmasi ketersediaan stok & petunjuk pembayarannya. Terima kasih!`,
    ]
      .filter((line) => line !== null)
      .join("\n");

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
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-slate-300 p-3.5 flex gap-3.5 transition-all shadow-2xs"
            >
              <div className="w-20 h-20 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60 relative">
                <ProductThumbnail name={product.name} src={displayPhoto} />
              </div>

              <div className="flex-1 flex flex-col justify-between min-w-0">
                <div>
                  <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">
                    {product.name}
                  </h3>
                  <p className="font-extrabold text-teal-800 text-sm mt-1">
                    {rupiah.format(Number(product.price) || 0)}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                  {qty === 0 ? (
                    <button
                      type="button"
                      onClick={() => addToCart(product.id)}
                      className="ml-auto inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold transition-colors active:scale-95"
                    >
                      <Icon name="plus" size={14} />
                      <span>Tambah</span>
                    </button>
                  ) : (
                    <div className="ml-auto inline-flex items-center gap-2 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                      <button
                        type="button"
                        onClick={() => removeFromCart(product.id)}
                        className="w-6 h-6 rounded-md bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs transition-colors"
                        aria-label={`Kurangi ${product.name}`}
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-slate-900 min-w-[1.2rem] text-center">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => addToCart(product.id)}
                        className="w-6 h-6 rounded-md bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center font-bold text-xs shadow-2xs transition-colors"
                        aria-label={`Tambah lagi ${product.name}`}
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Floating Bottom Cart Bar */}
      {totalItems > 0 && (
        <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 z-40 max-w-lg mx-auto animate-bounce-short">
          <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-xl border border-slate-800 flex items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm">
                {totalItems}
              </div>
              <div>
                <p className="text-[11px] text-slate-400 font-medium">Total Pesanan</p>
                <p className="font-extrabold text-sm sm:text-base text-white">{rupiah.format(totalPrice)}</p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white text-xs sm:text-sm font-bold shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <span>Lihat Keranjang</span>
              <Icon name="arrowRight" size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Cart & Checkout Drawer Modal */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs p-0 sm:p-4 animate-fade-in"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center">
                  <Icon name="shoppingBag" size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Keranjang Pesanan</h3>
                  <p className="text-[11px] text-slate-500">{storeName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <Icon name="close" size={18} />
              </button>
            </div>

            {/* Item list */}
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              {Object.entries(cart).map(([id, qty]) => {
                const item = products.find((p) => p.id === id);
                return (
                  <div key={id} className="flex justify-between items-center text-xs py-2 border-b border-slate-50">
                    <div className="flex-1 truncate mr-2">
                      <span className="font-bold text-slate-800">{qty}x</span>{" "}
                      <span className="text-slate-700">{item?.name}</span>
                    </div>
                    <span className="font-bold text-slate-900 shrink-0">
                      {rupiah.format((Number(item?.price) || 0) * qty)}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Total */}
            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-500">Subtotal ({totalItems} item):</span>
              <span className="text-base font-extrabold text-teal-800">{rupiah.format(totalPrice)}</span>
            </div>

            {/* Delivery vs Pickup Switcher */}
            <div className="pt-1">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Metode Pengambilan
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderMethod("delivery")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    orderMethod === "delivery"
                      ? "bg-teal-50 border-teal-600 text-teal-800 font-bold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon name="truck" size={14} className={orderMethod === "delivery" ? "text-teal-700" : "text-slate-400"} />
                  <span>Kirim (Delivery)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderMethod("pickup")}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    orderMethod === "pickup"
                      ? "bg-teal-50 border-teal-600 text-teal-800 font-bold"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon name="store" size={14} className={orderMethod === "pickup" ? "text-teal-700" : "text-slate-400"} />
                  <span>Ambil di Toko</span>
                </button>
              </div>

              {distance && orderMethod === "delivery" && (
                <p className="text-[11px] text-emerald-700 mt-1.5 flex items-center gap-1">
                  <Icon name="mapPin" size={12} />
                  <span>Posisi Anda sekitar <strong>{distance}</strong> dari lokasi toko.</span>
                </p>
              )}
            </div>

            {/* Inputs */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="cust-name">
                  Nama Anda
                </label>
                <input
                  id="cust-name"
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              {orderMethod === "delivery" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="cust-addr">
                    Alamat Lengkap Pengiriman
                  </label>
                  <textarea
                    id="cust-addr"
                    rows={2}
                    placeholder="Contoh: Jl. Diponegoro No. 15, RT 02/04, patokan dekat mini market..."
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600 resize-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="order-notes">
                  Catatan Tambahan (opsional)
                </label>
                <input
                  id="order-notes"
                  type="text"
                  placeholder="Contoh: Sambal dipisah, minta sendok/garpu..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckoutWA}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Icon name="chat" size={18} />
              <span>Lanjut Order via WhatsApp</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
