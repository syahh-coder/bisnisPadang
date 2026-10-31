"use client";

import { useState, useEffect } from "react";
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

export interface AgentFoodLinks {
  gofoodUrl: string;
  shopeefoodUrl: string;
  grabfoodUrl: string;
}

interface StoreOrderBuilderProps {
  products: OrderProduct[];
  storeName: string;
  storeSlug?: string;
  storePhone: string;
  whatsappUrl: string | null;
  storeAddress?: string;
  latitude?: number | null;
  longitude?: number | null;
  agentLinks?: AgentFoodLinks;
}

const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

/**
 * Branded SVG Icons untuk jembatan ke GoFood, ShopeeFood, GrabFood, & WA Delivery
 */
export function FoodAgentIcon({
  agent,
  size = 16,
}: {
  agent: "gofood" | "shopeefood" | "grabfood" | "whatsapp";
  size?: number;
}) {
  if (agent === "shopeefood") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
        <rect width="24" height="24" rx="6" fill="#EE4D2D" />
        <path
          d="M7 9.5h10l-.8 8.2a1.5 1.5 0 0 1-1.5 1.3H9.3a1.5 1.5 0 0 1-1.5-1.3L7 9.5Z"
          stroke="#fff"
          strokeWidth="1.7"
          strokeLinejoin="round"
        />
        <path d="M9.5 9.5V8a2.5 2.5 0 0 1 5 0v1.5" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
        <path d="M10.5 13.5c.4-.5 1.2-.7 2-.4.8.3 1 1.1.3 1.6-.7.5-1.8.6-2.3 1.2" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (agent === "gofood") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
        <rect width="24" height="24" rx="6" fill="#00AA13" />
        <circle cx="12" cy="12" r="6" stroke="#fff" strokeWidth="2" />
        <circle cx="12" cy="12" r="2.2" fill="#fff" />
        <path d="M12 6v2M18 12h-2" stroke="#00AA13" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }

  if (agent === "grabfood") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
        <rect width="24" height="24" rx="6" fill="#00B14F" />
        <path
          d="M7.5 14.5c0-2.5 2-4.5 4.5-4.5h4.5m-4.5 2.5h4.5m-7 2c.6 1.5 2 2.5 3.8 2.5 2.2 0 3.7-1.3 3.7-3.2V12"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <rect width="24" height="24" rx="6" fill="#10B981" />
      <path
        d="M17.5 14.2c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-1 1.1-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-1-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.2-.3-.3-.6-.4Z"
        fill="#fff"
      />
    </svg>
  );
}

export function StoreOrderBuilder({
  products,
  storeName,
  storeSlug,
  whatsappUrl,
  latitude,
  longitude,
  agentLinks,
}: StoreOrderBuilderProps) {
  const storageKey = `cart_v2_${storeSlug || storeName}`;
  const [cart, setCart] = useState<Record<string, number>>({});
  const [itemNotes, setItemNotes] = useState<Record<string, string>>({});
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [orderMethod, setOrderMethod] = useState<"delivery" | "pickup">("delivery");
  const [customerName, setCustomerName] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [manualAddressOverride, setManualAddressOverride] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const { location, setModalOpen, detectGpsLocation, detecting, setCustomLocation, getDistanceTo } = useLocation();
  const { alert: dialogAlert } = useDialog();
  const distance = getDistanceTo(latitude, longitude);

  const encodedStore = encodeURIComponent(storeName.trim());
  const links: AgentFoodLinks = agentLinks || {
    gofoodUrl: `https://gofood.co.id/search?q=${encodedStore}`,
    shopeefoodUrl: `https://shopee.co.id/search?keyword=${encodedStore}`,
    grabfoodUrl: `https://food.grab.com/id/id/restaurants?search=${encodedStore}`,
  };

  // Load saved cart & user profile from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(storageKey);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (parsed.cart) setCart(parsed.cart);
        if (parsed.itemNotes) setItemNotes(parsed.itemNotes);
      }
      const savedProfile = localStorage.getItem("toko_lokal_customer_v1");
      if (savedProfile) {
        const prof = JSON.parse(savedProfile);
        if (prof.name) setCustomerName(prof.name);
        if (prof.addressDetail) setAddressDetail(prof.addressDetail);
      }
    } catch {
      // ignore storage errors
    }
  }, [storageKey]);

  // Persist cart changes
  useEffect(() => {
    try {
      if (Object.keys(cart).length > 0) {
        localStorage.setItem(storageKey, JSON.stringify({ cart, itemNotes }));
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch {
      // ignore
    }
  }, [cart, itemNotes, storageKey]);

  // Persist customer name & detail patokan
  const saveCustomerInfo = (name: string, detail: string) => {
    try {
      localStorage.setItem("toko_lokal_customer_v1", JSON.stringify({ name, addressDetail: detail }));
    } catch {
      // ignore
    }
  };

  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    setValidationError(null);
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

  const clearCart = () => {
    setCart({});
    setItemNotes({});
    setDrawerOpen(false);
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
    const p = products.find((item) => item.id === id);
    return sum + (Number(p?.price) || 0) * qty;
  }, 0);

  // Alamat otomatis dari sistem (LocationContext di navbar atau input manual saat pesan)
  const systemBaseAddress = location?.name || manualAddressOverride.trim();
  const fullResolvedAddress = [
    systemBaseAddress,
    addressDetail.trim() ? `(Patokan/Detail: ${addressDetail.trim()})` : "",
  ]
    .filter(Boolean)
    .join(" ");

  const userMapsPinUrl =
    location?.latitude != null && location?.longitude != null
      ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
      : null;

  // Pembuat template pesan WhatsApp otomatis bernomor 1, 2, 3 dst
  const buildWhatsAppMessage = () => {
    const cleanName = customerName.trim() || "Pelanggan";
    const numberedItems = Object.entries(cart)
      .map(([id, qty], index) => {
        const p = products.find((item) => item.id === id);
        const subtotal = rupiah.format((Number(p?.price) || 0) * qty);
        const note = itemNotes[id]?.trim();
        return `${index + 1}. ${p?.name} (${qty}x) - ${subtotal}${note ? ` [Catatan: ${note}]` : ""}`;
      })
      .join("\n");

    const lines: (string | null)[] = [
      `Halo kak, saya *${cleanName}*, pengen pesan menu ini di *${storeName}*:`,
      ``,
      numberedItems,
      ``,
      `*Total Pesanan:* ${rupiah.format(totalPrice)} (${totalItems} item)`,
      `*Metode Pesanan:* ${
        orderMethod === "delivery"
          ? "🛵 Delivery Toko (Diantar ke Alamat)"
          : "🏪 Ambil Sendiri di Toko (Pickup)"
      }`,
    ];

    if (orderMethod === "delivery") {
      lines.push(
        ``,
        `*Alamat Pengiriman (Otomatis Sistem):*`,
        `${fullResolvedAddress || "-"}`,
        distance ? `*Estimasi Jarak:* ± ${distance} dari toko` : null,
        userMapsPinUrl ? `*Titik Lokasi Maps:* ${userMapsPinUrl}` : null
      );
    }

    if (orderNotes.trim()) {
      lines.push(``, `*Catatan Tambahan:* ${orderNotes.trim()}`);
    }

    lines.push(``, `Mohon konfirmasi pesanan saya ya kak. Terima kasih!`);

    return lines.filter((line) => line !== null).join("\n");
  };

  const handleCheckoutWA = () => {
    setValidationError(null);

    if (!whatsappUrl) {
      dialogAlert({
        title: "Nomor WhatsApp Belum Tersedia",
        message:
          "Toko ini belum menyertakan nomor WhatsApp delivery. Kamu tetap bisa memesan lewat tombol GoFood, ShopeeFood, atau GrabFood yang tersedia!",
        variant: "warning",
        confirmText: "Mengerti",
      });
      return;
    }

    if (!customerName.trim()) {
      setValidationError("Mohon isi Nama kamu terlebih dahulu agar toko tahu siapa yang memesan.");
      const nameInput = document.getElementById("cust-name");
      nameInput?.focus();
      return;
    }

    // Wajib atur posisi dulu sebelum pesan delivery
    if (orderMethod === "delivery" && !systemBaseAddress) {
      setValidationError(
        "Wajib atur posisi/lokasi pengiriman terlebih dahulu (lewat tombol GPS/Lokasi atau ketik di bawah) supaya alamat otomatis terisi."
      );
      return;
    }

    // Jika user mengetik alamat manual tapi belum tersimpan di LocationContext navbar, sinkronkan otomatis
    if (!location && manualAddressOverride.trim()) {
      setCustomLocation(manualAddressOverride.trim());
    }

    saveCustomerInfo(customerName.trim(), addressDetail.trim());

    const message = buildWhatsAppMessage();
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
      {/* Banner Status Lokasi Pengiriman (Wajib Atur Posisi Sebelum Pesan) */}
      <div
        className={`rounded-2xl border p-3.5 sm:p-4 transition-all ${
          location
            ? "bg-emerald-50/70 border-emerald-200/90 text-emerald-950"
            : "bg-amber-50/90 border-amber-300/90 text-amber-950 shadow-2xs"
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                location ? "bg-emerald-600 text-white" : "bg-amber-500 text-white animate-pulse"
              }`}
            >
              <Icon name="mapPin" size={18} />
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-extrabold uppercase tracking-wider">
                  {location ? "Lokasi Pengiriman Aktif" : "Wajib Atur Lokasi Sebelum Pesan"}
                </span>
                {distance && (
                  <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-white text-emerald-800 border border-emerald-200">
                    🛵 ± {distance} dari toko
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm font-semibold mt-0.5 truncate">
                {location
                  ? location.name
                  : "Atur posisimu dulu agar alamat pengiriman di WhatsApp dibuatkan otomatis oleh sistem."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!location && (
              <button
                type="button"
                onClick={detectGpsLocation}
                disabled={detecting}
                className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Icon name="sparkles" size={14} />
                <span>{detecting ? "Mendeteksi GPS…" : "Deteksi GPS"}</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                location
                  ? "bg-white hover:bg-emerald-100/60 text-emerald-900 border border-emerald-200"
                  : "bg-slate-900 hover:bg-slate-800 text-white shadow-2xs"
              }`}
            >
              <Icon name="mapPin" size={14} />
              <span>{location ? "Ubah Lokasi" : "Pilih Lokasi"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Daftar Kartu Menu ala ShopeeFood & GoFood */}
      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" aria-label="Menu dan produk toko">
        {products.map((product) => {
          const qty = cart[product.id] || 0;
          const displayPhoto =
            product.photo_url || (product.photo_path?.startsWith("http") ? product.photo_path : null);

          return (
            <li
              key={product.id}
              className={`bg-white rounded-2xl border p-3.5 flex flex-col justify-between gap-3 transition-all shadow-2xs ${
                qty > 0
                  ? "border-teal-600 ring-1 ring-teal-600/20 bg-teal-50/10"
                  : "border-slate-200/90 hover:border-slate-300"
              }`}
            >
              <div className="flex gap-3.5">
                <div className="w-22 h-22 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60 relative">
                  <ProductThumbnail name={product.name} src={displayPhoto} />
                  {qty > 0 && (
                    <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md bg-teal-700 text-white text-[10px] font-extrabold shadow-xs">
                      {qty}x di Keranjang
                    </span>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="font-extrabold text-teal-800 text-sm sm:text-base mt-1">
                      {rupiah.format(Number(product.price) || 0)}
                    </p>
                  </div>

                  {/* Baris Icon Jembatan ke Agent Food + Tombol Keranjang */}
                  <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-100">
                    {/* Icon Jembatan Cepat ke Agent Food */}
                    <div className="flex items-center gap-1" title="Jembatan ke Aplikasi Food Delivery">
                      <a
                        href={links.shopeefoodUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Pesan ${product.name} via ShopeeFood`}
                        aria-label={`ShopeeFood ${product.name}`}
                        className="p-1 rounded-lg hover:bg-orange-50 border border-transparent hover:border-orange-200 transition-all hover:scale-105"
                      >
                        <FoodAgentIcon agent="shopeefood" size={18} />
                      </a>
                      <a
                        href={links.gofoodUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Pesan ${product.name} via GoFood`}
                        aria-label={`GoFood ${product.name}`}
                        className="p-1 rounded-lg hover:bg-emerald-50 border border-transparent hover:border-emerald-200 transition-all hover:scale-105"
                      >
                        <FoodAgentIcon agent="gofood" size={18} />
                      </a>
                      <a
                        href={links.grabfoodUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={`Pesan ${product.name} via GrabFood`}
                        aria-label={`GrabFood ${product.name}`}
                        className="p-1 rounded-lg hover:bg-green-50 border border-transparent hover:border-green-200 transition-all hover:scale-105"
                      >
                        <FoodAgentIcon agent="grabfood" size={18} />
                      </a>
                    </div>

                    {/* Tombol + Tambah ke Keranjang */}
                    {qty === 0 ? (
                      <button
                        type="button"
                        onClick={() => addToCart(product.id)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                      >
                        <Icon name="plus" size={14} />
                        <span>Keranjang</span>
                      </button>
                    ) : (
                      <div className="inline-flex items-center gap-2 bg-slate-100 rounded-xl p-0.5 border border-slate-200">
                        <button
                          type="button"
                          onClick={() => removeFromCart(product.id)}
                          className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                          aria-label={`Kurangi ${product.name}`}
                        >
                          -
                        </button>
                        <span className="text-xs font-extrabold text-slate-900 min-w-[1.25rem] text-center">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => addToCart(product.id)}
                          className="w-7 h-7 rounded-lg bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center font-bold text-xs shadow-2xs transition-colors cursor-pointer"
                          aria-label={`Tambah lagi ${product.name}`}
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Catatan singkat per item saat sudah masuk keranjang */}
              {qty > 0 && (
                <div className="pt-2 border-t border-teal-100/80 flex items-center gap-2">
                  <Icon name="edit" size={13} className="text-teal-700 shrink-0" />
                  <input
                    type="text"
                    placeholder="Catatan menu ini (misal: pedas, kuah pisah)..."
                    value={itemNotes[product.id] || ""}
                    onChange={(e) =>
                      setItemNotes((prev) => ({ ...prev, [product.id]: e.target.value }))
                    }
                    className="w-full text-[11px] bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-teal-600"
                  />
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {/* Floating Bottom Cart Bar ala ShopeeFood / GoFood */}
      {totalItems > 0 && (
        <div className="fixed bottom-20 sm:bottom-6 left-4 right-4 z-40 max-w-xl mx-auto">
          <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl shadow-2xl border border-slate-700/80 flex items-center justify-between gap-3 backdrop-blur-md">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500 to-emerald-400 text-slate-950 flex items-center justify-center font-extrabold text-sm shadow-sm">
                  <Icon name="shoppingBag" size={20} />
                </div>
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-amber-500 text-slate-950 text-[11px] font-extrabold flex items-center justify-center shadow">
                  {totalItems}
                </span>
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className="font-extrabold text-sm sm:text-base text-white">
                    {rupiah.format(totalPrice)}
                  </p>
                  {distance && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">
                      ± {distance}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 truncate">
                  {location ? `📍 ${location.name}` : "⚠️ Lokasi pengiriman belum diatur"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                setValidationError(null);
                setDrawerOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white text-xs sm:text-sm font-extrabold shadow-md flex items-center gap-1.5 active:scale-95 transition-all cursor-pointer shrink-0"
            >
              <span>Checkout ({totalItems})</span>
              <Icon name="arrowRight" size={15} />
            </button>
          </div>
        </div>
      )}

      {/* Modal Keranjang & Multi-Cara Checkout */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-xs p-0 sm:p-4 animate-fade-in"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl max-h-[92vh] overflow-y-auto space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Keranjang */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-800 flex items-center justify-center">
                  <Icon name="shoppingBag" size={19} />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    Keranjang & Metode Pesan
                  </h3>
                  <p className="text-xs text-slate-500">{storeName}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={clearCart}
                  className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  Kosongkan
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  aria-label="Tutup keranjang"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
            </div>

            {/* Daftar Menu Bernomor (1, 2, 3 dst) */}
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {Object.entries(cart).map(([id, qty], index) => {
                const item = products.find((p) => p.id === id);
                if (!item) return null;
                return (
                  <div
                    key={id}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                        <span className="w-5 h-5 rounded-md bg-teal-700 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                          {index + 1}
                        </span>
                        <span className="font-bold text-slate-900 truncate">{item.name}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="inline-flex items-center gap-1.5 bg-white rounded-lg px-1.5 py-0.5 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => removeFromCart(id)}
                            className="text-slate-600 hover:text-slate-900 font-bold px-1 cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-extrabold text-slate-900">{qty}x</span>
                          <button
                            type="button"
                            onClick={() => addToCart(id)}
                            className="text-teal-700 hover:text-teal-900 font-bold px-1 cursor-pointer"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-extrabold text-teal-800 min-w-[4.5rem] text-right">
                          {rupiah.format((Number(item.price) || 0) * qty)}
                        </span>
                      </div>
                    </div>
                    {itemNotes[id] && (
                      <p className="text-[11px] text-slate-500 pl-7 italic">
                        Catatan: &ldquo;{itemNotes[id]}&rdquo;
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Subtotal */}
            <div className="py-2.5 px-3.5 rounded-xl bg-teal-50/70 border border-teal-200/70 flex justify-between items-center">
              <span className="text-xs font-bold text-teal-950">
                Total Harga Menu ({totalItems} item):
              </span>
              <span className="text-base font-extrabold text-teal-800">
                {rupiah.format(totalPrice)}
              </span>
            </div>

            {/* Pilihan 1: Delivery Toko (WA) vs Pickup */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                1. Pilih Metode Pesanan Toko (Tanpa Biaya Admin Aplikasi)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setOrderMethod("delivery")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    orderMethod === "delivery"
                      ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold shadow-2xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon
                    name="truck"
                    size={15}
                    className={orderMethod === "delivery" ? "text-emerald-700" : "text-slate-400"}
                  />
                  <span>Delivery Kurir Toko</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrderMethod("pickup")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                    orderMethod === "pickup"
                      ? "bg-emerald-50 border-emerald-600 text-emerald-900 font-bold shadow-2xs"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Icon
                    name="store"
                    size={15}
                    className={orderMethod === "pickup" ? "text-emerald-700" : "text-slate-400"}
                  />
                  <span>Ambil di Toko</span>
                </button>
              </div>
            </div>

            {/* Bagian Wajib Lokasi & Alamat Otomatis Sistem */}
            {orderMethod === "delivery" && (
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Icon name="mapPin" size={14} className="text-teal-700" />
                    <span>2. Alamat Pengiriman (Otomatis dari Posisi)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="text-[11px] font-bold text-teal-700 hover:underline cursor-pointer"
                  >
                    {location ? "Ubah Titik Lokasi" : "Pilih via Peta/GPS"}
                  </button>
                </div>

                {location ? (
                  <div className="p-2.5 rounded-xl bg-white border border-emerald-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-800 flex items-center gap-1">
                        <Icon name="check" size={13} /> Lokasi Terdeteksi Sistem:
                      </span>
                      {distance && (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          ± {distance}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-800 font-semibold leading-snug">{location.name}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-center justify-between gap-2">
                      <span>Posisi belum diatur di navbar. Atur otomatis lewat GPS atau ketik manual:</span>
                      <button
                        type="button"
                        onClick={detectGpsLocation}
                        disabled={detecting}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 cursor-pointer"
                      >
                        {detecting ? "Mencari…" : "📍 Pakai GPS"}
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Atau ketik alamat lengkap / nama jalan & kecamatan di sini..."
                      value={manualAddressOverride}
                      onChange={(e) => {
                        setManualAddressOverride(e.target.value);
                        setValidationError(null);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                )}

                <div>
                  <label
                    className="block text-[11px] font-semibold text-slate-600 mb-1"
                    htmlFor="cust-addr-detail"
                  >
                    Detail Patokan / Nomor Rumah (Opsional)
                  </label>
                  <input
                    id="cust-addr-detail"
                    type="text"
                    placeholder="Contoh: Rumah No. 12, pagar hitam, dekat masjid..."
                    value={addressDetail}
                    onChange={(e) => setAddressDetail(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>
            )}

            {/* Input Nama & Catatan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="cust-name">
                  Nama Pemesan <span className="text-rose-600">*</span>
                </label>
                <input
                  id="cust-name"
                  type="text"
                  required
                  placeholder="Contoh: Budi"
                  value={customerName}
                  onChange={(e) => {
                    setCustomerName(e.target.value);
                    setValidationError(null);
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="order-notes">
                  Catatan Tambahan
                </label>
                <input
                  id="order-notes"
                  type="text"
                  placeholder="Contoh: Minta sendok, sambal pisah..."
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                />
              </div>
            </div>

            {/* Pratinjau Template Format WhatsApp Otomatis */}
            <details className="group rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs">
              <summary className="font-bold text-slate-700 cursor-pointer flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Icon name="chat" size={14} className="text-emerald-600" />
                  <span>Lihat Pratinjau Format Pesan WhatsApp Otomatis</span>
                </span>
                <Icon
                  name="chevronDown"
                  size={14}
                  className="text-slate-400 group-open:rotate-180 transition-transform"
                />
              </summary>
              <pre className="mt-2 p-2.5 rounded-lg bg-white border border-slate-200/80 text-[11px] text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                {buildWhatsAppMessage()}
              </pre>
            </details>

            {validationError && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-start gap-2"
              >
                <Icon name="alertCircle" size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <span>{validationError}</span>
              </div>
            )}

            {/* Tombol Utama: Kirim ke WA Delivery Toko */}
            <button
              type="button"
              onClick={handleCheckoutWA}
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-extrabold text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <FoodAgentIcon agent="whatsapp" size={20} />
              <span>Kirim Pesanan ke WA Delivery Toko</span>
            </button>

            {/* Jembatan Alternatif: Pesan Lewat GoFood / ShopeeFood / GrabFood */}
            <div className="pt-3 border-t border-slate-200/90">
              <p className="text-[11px] font-bold text-slate-500 text-center mb-2">
                Atau pesan langsung lewat jembatan aplikasi Food Delivery resmi toko:
              </p>
              <div className="grid grid-cols-3 gap-2">
                <a
                  href={links.shopeefoodUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-2.5 rounded-xl border border-orange-200 bg-orange-50/60 hover:bg-orange-100/70 text-orange-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <FoodAgentIcon agent="shopeefood" size={16} />
                  <span>ShopeeFood</span>
                </a>
                <a
                  href={links.gofoodUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <FoodAgentIcon agent="gofood" size={16} />
                  <span>GoFood</span>
                </a>
                <a
                  href={links.grabfoodUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 px-2.5 rounded-xl border border-green-200 bg-green-50/60 hover:bg-green-100/70 text-green-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                >
                  <FoodAgentIcon agent="grabfood" size={16} />
                  <span>GrabFood</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
