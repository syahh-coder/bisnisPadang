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
  gofoodUrl?: string | null;
  shopeefoodUrl?: string | null;
  grabfoodUrl?: string | null;
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
 * Custom Vector SVG Icons untuk jembatan ke GoFood, ShopeeFood, GrabFood, & WhatsApp Delivery
 */
export function FoodAgentIcon({
  agent,
  size = 18,
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
        <path
          d="M10.5 13.5c.4-.5 1.2-.7 2-.4.8.3 1 1.1.3 1.6-.7.5-1.8.6-2.3 1.2"
          stroke="#fff"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  if (agent === "gofood") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
        <rect width="24" height="24" rx="6" fill="#00AA13" />
        <path
          d="M8.5 7v5a2 2 0 0 0 4 0V7M10.5 7v10M15.5 7v10M15.5 7c1.5 0 2.5 1.2 2.5 3v2h-2.5"
          stroke="#fff"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (agent === "grabfood") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
        <rect width="24" height="24" rx="6" fill="#00B14F" />
        <path
          d="M16.5 9.5A5 5 0 1 0 17 13h-4.5"
          stroke="#fff"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" className="shrink-0">
      <rect width="24" height="24" rx="6" fill="#0F766E" />
      <path
        d="M19 11.5a7 7 0 0 1-10.4 6.1L5 19l1.4-3.5A7 7 0 1 1 19 11.5Z"
        stroke="#fff"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M9.5 10c.3 1.5 1.7 2.9 3.2 3.2l1.1-.8c.3-.2.7-.1.9.1l.8 1.1c.2.3.1.8-.2 1-.9.6-2.2.5-3.5-.2a7.6 7.6 0 0 1-3.1-3.1c-.7-1.3-.8-2.6-.2-3.5.2-.3.7-.4 1-.2l1.1.8c.2.2.3.6.1.9l-.8 1.1Z"
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

  // Info Pemesan & Alamat Lengkap (Semua Wajib Diisi)
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [manualAddressOverride, setManualAddressOverride] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const { location, setModalOpen, detectGpsLocation, detecting, setCustomLocation, getDistanceTo } =
    useLocation();
  const { alert: dialogAlert } = useDialog();
  const distance = getDistanceTo(latitude, longitude);

  const links: AgentFoodLinks = agentLinks || {
    gofoodUrl: null,
    shopeefoodUrl: null,
    grabfoodUrl: null,
  };
  const hasAnyAgentLink = Boolean(links.shopeefoodUrl || links.gofoodUrl || links.grabfoodUrl);

  // Load saved cart & user profile from localStorage
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem(storageKey);
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (parsed.cart) setCart(parsed.cart);
        if (parsed.itemNotes) setItemNotes(parsed.itemNotes);
      }
      const savedProfile = localStorage.getItem("toko_lokal_customer_v2");
      if (savedProfile) {
        const prof = JSON.parse(savedProfile);
        if (prof.name) setCustomerName(prof.name);
        if (prof.phone) setCustomerPhone(prof.phone);
        if (prof.streetAddress) setStreetAddress(prof.streetAddress);
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

  const saveCustomerInfo = (
    name: string,
    phone: string,
    street: string,
    detail: string
  ) => {
    try {
      localStorage.setItem(
        "toko_lokal_customer_v2",
        JSON.stringify({
          name,
          phone,
          streetAddress: street,
          addressDetail: detail,
        })
      );
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

  // Alamat otomatis dari sistem (LocationContext di navbar atau input wilayah saat pesan)
  const systemBaseAddress = location?.name || manualAddressOverride.trim();

  const userMapsPinUrl =
    location?.latitude != null && location?.longitude != null
      ? `https://www.google.com/maps?q=${location.latitude},${location.longitude}`
      : null;

  // Pembuat template pesan WhatsApp otomatis bernomor 1, 2, 3 dst (Tanpa Emoji)
  const buildWhatsAppMessage = () => {
    const cleanName = customerName.trim() || "[Nama Pemesan]";
    const cleanPhone = customerPhone.trim() || "[Nomor HP]";
    const numberedItems = Object.entries(cart)
      .map(([id, qty], index) => {
        const p = products.find((item) => item.id === id);
        const subtotal = rupiah.format((Number(p?.price) || 0) * qty);
        const note = itemNotes[id]?.trim();
        return `${index + 1}. ${p?.name} (${qty}x) - ${subtotal}${note ? ` [Catatan: ${note}]` : ""}`;
      })
      .join("\n");

    const lines: (string | null)[] = [
      `Halo kak, saya *${cleanName}* (${cleanPhone}), pengen pesan menu ini di *${storeName}*:`,
      ``,
      numberedItems,
      ``,
      `*Total Pesanan:* ${rupiah.format(totalPrice)} (${totalItems} item)`,
      `*Metode Pesanan:* ${
        orderMethod === "delivery"
          ? "Delivery Kurir Toko (Diantar ke Alamat)"
          : "Ambil Sendiri di Toko (Pickup)"
      }`,
      `*Nama Pemesan:* ${cleanName}`,
      `*No. HP / WA Pemesan:* ${cleanPhone}`,
    ];

    if (orderMethod === "delivery") {
      lines.push(
        ``,
        `*Alamat Pengiriman Lengkap:*`,
        `- Wilayah / Titik Sistem: ${systemBaseAddress || "[Belum diatur]"}`,
        `- Jalan & No. Rumah: ${streetAddress.trim() || "[Belum diisi]"}`,
        `- Detail Patokan: ${addressDetail.trim() || "[Belum diisi]"}`,
        distance ? `- Estimasi Jarak: +/- ${distance} dari toko` : null,
        userMapsPinUrl ? `- Titik Google Maps: ${userMapsPinUrl}` : null
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
          "Toko ini belum menyertakan nomor WhatsApp delivery. Kamu tetap bisa memesan lewat tombol GoFood, ShopeeFood, atau GrabFood yang tersedia.",
        variant: "warning",
        confirmText: "Mengerti",
      });
      return;
    }

    if (!customerName.trim() || customerName.trim().length < 2) {
      setValidationError("Nama Pemesan wajib diisi (minimal 2 huruf).");
      document.getElementById("cust-name")?.focus();
      return;
    }

    const cleanPhoneDigits = customerPhone.replace(/[^0-9]/g, "");
    if (!cleanPhoneDigits || cleanPhoneDigits.length < 9) {
      setValidationError("Nomor HP / WhatsApp Pemesan wajib diisi dengan nomor aktif yang valid.");
      document.getElementById("cust-phone")?.focus();
      return;
    }

    if (orderMethod === "delivery") {
      if (!systemBaseAddress) {
        setValidationError(
          "Titik Lokasi / Wilayah pengiriman wajib diatur terlebih dahulu (klik tombol GPS/Lokasi atau ketik wilayah)."
        );
        document.getElementById("cust-region")?.focus();
        return;
      }

      if (!streetAddress.trim() || streetAddress.trim().length < 4) {
        setValidationError(
          "Alamat Jalan, RT/RW, atau Nomor Rumah wajib diisi dengan lengkap."
        );
        document.getElementById("cust-street")?.focus();
        return;
      }

      if (!addressDetail.trim() || addressDetail.trim().length < 3) {
        setValidationError(
          "Detail Patokan Lokasi (warna pagar, ciri bangunan, atau patokan terdekat) wajib diisi."
        );
        document.getElementById("cust-addr-detail")?.focus();
        return;
      }
    }

    if (!location && manualAddressOverride.trim()) {
      setCustomLocation(manualAddressOverride.trim());
    }

    saveCustomerInfo(
      customerName.trim(),
      customerPhone.trim(),
      streetAddress.trim(),
      addressDetail.trim()
    );

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
                location ? "bg-emerald-600 text-white" : "bg-amber-500 text-white"
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
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-white text-emerald-800 border border-emerald-200">
                    <Icon name="truck" size={12} className="text-emerald-700" />
                    <span>+/- {distance} dari toko</span>
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
                      {qty}x
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

                  {/* Baris Icon Jembatan ke Agent Food (Hanya yang dimiliki toko) + Tombol Keranjang */}
                  <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-100">
                    {hasAnyAgentLink ? (
                      <div className="flex items-center gap-1" title="Tersedia di Aplikasi Food Delivery">
                        {links.shopeefoodUrl && (
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
                        )}
                        {links.gofoodUrl && (
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
                        )}
                        {links.grabfoodUrl && (
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
                        )}
                      </div>
                    ) : (
                      <span />
                    )}

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
                          className="w-7 h-7 rounded-lg bg-white hover:bg-slate-200 text-slate-700 flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                          aria-label={`Kurangi ${product.name}`}
                        >
                          <Icon name="minus" size={13} />
                        </button>
                        <span className="text-xs font-extrabold text-slate-900 min-w-[1.25rem] text-center">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => addToCart(product.id)}
                          className="w-7 h-7 rounded-lg bg-teal-700 hover:bg-teal-800 text-white flex items-center justify-center shadow-2xs transition-colors cursor-pointer"
                          aria-label={`Tambah lagi ${product.name}`}
                        >
                          <Icon name="plus" size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

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

      {/* Floating Bottom Cart Bar (Full SVG Icons, Zero Emoji) */}
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
                      +/- {distance}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 truncate flex items-center gap-1">
                  {location ? (
                    <>
                      <Icon name="mapPin" size={12} className="text-emerald-400 shrink-0" />
                      <span className="truncate">{location.name}</span>
                    </>
                  ) : (
                    <>
                      <Icon name="alertCircle" size={12} className="text-amber-400 shrink-0" />
                      <span className="truncate">Lokasi pengiriman belum diatur</span>
                    </>
                  )}
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
                    Keranjang & Data Pengiriman
                  </h3>
                  <p className="text-xs text-slate-500">{storeName}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={clearCart}
                  className="px-2.5 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                >
                  <Icon name="trash" size={13} />
                  <span>Kosongkan</span>
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
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
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
                            className="text-slate-600 hover:text-slate-900 p-0.5 cursor-pointer"
                            aria-label={`Kurangi ${item.name}`}
                          >
                            <Icon name="minus" size={12} />
                          </button>
                          <span className="font-extrabold text-slate-900">{qty}x</span>
                          <button
                            type="button"
                            onClick={() => addToCart(id)}
                            className="text-teal-700 hover:text-teal-900 p-0.5 cursor-pointer"
                            aria-label={`Tambah ${item.name}`}
                          >
                            <Icon name="plus" size={12} />
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

            {/* Pilihan 2: Info Pemesan (Wajib Diisi) */}
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Icon name="user" size={15} className="text-teal-700" />
                <span>2. Informasi Pemesan (Wajib Diisi)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1" htmlFor="cust-name">
                    Nama Pemesan <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="cust-name"
                      type="text"
                      required
                      placeholder="Contoh: Budi Santoso"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        setValidationError(null);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1" htmlFor="cust-phone">
                    No. HP / WhatsApp Aktif <span className="text-rose-600">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="cust-phone"
                      type="tel"
                      required
                      placeholder="Contoh: 081234567890"
                      value={customerPhone}
                      onChange={(e) => {
                        setCustomerPhone(e.target.value);
                        setValidationError(null);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Pilihan 3: Detail Alamat Pengiriman Lengkap (Semua Wajib Diisi untuk Delivery) */}
            {orderMethod === "delivery" && (
              <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Icon name="mapPin" size={15} className="text-teal-700" />
                    <span>3. Detail Alamat Pengiriman (Semua Wajib Diisi)</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="text-[11px] font-bold text-teal-700 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Icon name="mapPin" size={12} />
                    <span>{location ? "Ubah Titik Lokasi" : "Pilih via Peta/GPS"}</span>
                  </button>
                </div>

                {/* Titik Lokasi / Wilayah dari Sistem */}
                {location ? (
                  <div className="p-2.5 rounded-xl bg-white border border-emerald-200 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-800 flex items-center gap-1">
                        <Icon name="check" size={13} />
                        <span>Wilayah Terdeteksi Sistem:</span>
                      </span>
                      {distance && (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          +/- {distance}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-800 font-semibold leading-snug">{location.name}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-center justify-between gap-2">
                      <span className="flex items-center gap-1.5">
                        <Icon name="alertCircle" size={14} className="text-amber-700 shrink-0" />
                        <span>Titik wilayah belum diatur di navbar. Atur otomatis lewat GPS atau isi di bawah:</span>
                      </span>
                      <button
                        type="button"
                        onClick={detectGpsLocation}
                        disabled={detecting}
                        className="px-2.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold shrink-0 cursor-pointer flex items-center gap-1"
                      >
                        <Icon name="mapPin" size={12} />
                        <span>{detecting ? "Mencari…" : "Pakai GPS"}</span>
                      </button>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1" htmlFor="cust-region">
                        Kecamatan / Kelurahan / Kota <span className="text-rose-600">*</span>
                      </label>
                      <input
                        id="cust-region"
                        type="text"
                        required
                        placeholder="Contoh: Kec. Bojongsoang, Kab. Bandung"
                        value={manualAddressOverride}
                        onChange={(e) => {
                          setManualAddressOverride(e.target.value);
                          setValidationError(null);
                        }}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                      />
                    </div>
                  </div>
                )}

                {/* Nama Jalan, RT/RW, & Nomor Rumah (Wajib) */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1" htmlFor="cust-street">
                    Nama Jalan, RT/RW, & Nomor Rumah <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="cust-street"
                    type="text"
                    required
                    placeholder="Contoh: Jl. Melati No. 12, RT 03 / RW 05, Komplek Griya Asri"
                    value={streetAddress}
                    onChange={(e) => {
                      setStreetAddress(e.target.value);
                      setValidationError(null);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>

                {/* Detail Patokan Lokasi (Wajib) */}
                <div>
                  <label
                    className="block text-[11px] font-bold text-slate-700 mb-1"
                    htmlFor="cust-addr-detail"
                  >
                    Detail Patokan Lokasi / Ciri Rumah <span className="text-rose-600">*</span>
                  </label>
                  <input
                    id="cust-addr-detail"
                    type="text"
                    required
                    placeholder="Contoh: Pagar warna hitam, samping masjid Al-Ikhlas"
                    value={addressDetail}
                    onChange={(e) => {
                      setAddressDetail(e.target.value);
                      setValidationError(null);
                    }}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
                  />
                </div>
              </div>
            )}

            {/* Catatan Tambahan Pesanan */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1" htmlFor="order-notes">
                Catatan Tambahan Pesanan (Opsional)
              </label>
              <input
                id="order-notes"
                type="text"
                placeholder="Contoh: Minta sendok plastik, sambal dipisah..."
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-600"
              />
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

            {/* Jembatan Alternatif: Hanya tampilkan aplikasi Food Delivery yang dimiliki toko */}
            {hasAnyAgentLink && (
              <div className="pt-3 border-t border-slate-200/90">
                <p className="text-[11px] font-bold text-slate-500 text-center mb-2">
                  Atau pesan langsung lewat jembatan aplikasi Food Delivery resmi toko:
                </p>
                <div className="flex flex-wrap gap-2">
                  {links.shopeefoodUrl && (
                    <a
                      href={links.shopeefoodUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[110px] py-2 px-2.5 rounded-xl border border-orange-200 bg-orange-50/60 hover:bg-orange-100/70 text-orange-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <FoodAgentIcon agent="shopeefood" size={16} />
                      <span>ShopeeFood</span>
                    </a>
                  )}
                  {links.gofoodUrl && (
                    <a
                      href={links.gofoodUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[110px] py-2 px-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 text-emerald-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <FoodAgentIcon agent="gofood" size={16} />
                      <span>GoFood</span>
                    </a>
                  )}
                  {links.grabfoodUrl && (
                    <a
                      href={links.grabfoodUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 min-w-[110px] py-2 px-2.5 rounded-xl border border-green-200 bg-green-50/60 hover:bg-green-100/70 text-green-950 text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                    >
                      <FoodAgentIcon agent="grabfood" size={16} />
                      <span>GrabFood</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
