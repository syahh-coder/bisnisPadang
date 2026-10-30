import Link from "next/link";
import { adminClient, pageNumber } from "@/lib/admin";
import { demoCategories, getAllDemoStores, getDemoBookings } from "@/lib/catalog/demo";
import { DeleteStoreButton, CatalogResetControls } from "@/components/admin-store-actions";
import { Icon } from "@/components/icon";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ halaman?: string; q?: string; kategori?: string; dihapus?: string; kosong?: string; contoh?: string }>;
}) {
  const params = await searchParams;
  const page = pageNumber(params.halaman);
  const searchQuery = (params.q || "").toLowerCase().trim();
  const selectedCategory = params.kategori || "";

  let stores: any[] = [];
  let totalCount = 0;
  let categories: any[] = demoCategories;
  let bookingsCount = 0;

  try {
    const client = await adminClient();
    if (client) {
      let query = client
        .from("stores")
        .select("id,name,slug,manager_name,owner_id,phone,address,delivery_info,category_id", { count: "exact" });

      if (selectedCategory) {
        query = query.eq("category_id", selectedCategory);
      }
      if (searchQuery) {
        query = query.ilike("name", `%${searchQuery}%`);
      }

      const result = await query
        .order("created_at", { ascending: false })
        .order("id")
        .range((page - 1) * 20, page * 20 - 1);

      if (!result.error && result.data) {
        stores = result.data;
        totalCount = result.count ?? stores.length;
        const catRes = await client.from("categories").select("id,name");
        if (catRes.data) categories = catRes.data;
        const reqRes = await client.from("affiliation_requests").select("id", { count: "exact", head: true });
        bookingsCount = reqRes.count ?? 0;
      }
    }
  } catch {
    // demo fallback
  }

  // Fallback to active demo stores
  if (stores.length === 0 && !searchQuery && !selectedCategory) {
    const demoStores = getAllDemoStores();
    stores = demoStores.map((s) => ({
      id: s.id,
      name: s.name,
      slug: s.slug,
      manager_name: s.manager_name || "Pemilik Toko",
      owner_id: s.id === "00000000-0000-4000-8000-000000000101" ? s.id : null,
      phone: s.phone,
      address: s.address,
      delivery_info: s.delivery_info,
      category_id: s.category_id || "00000000-0000-4000-8000-000000000001",
    }));
    totalCount = stores.length;
    bookingsCount = getDemoBookings().length;
  } else if (searchQuery || selectedCategory) {
    const all = getAllDemoStores().filter((s) => {
      const matchCat = !selectedCategory || s.category_id === selectedCategory || s.category_slug === selectedCategory;
      const matchQ = !searchQuery || s.name.toLowerCase().includes(searchQuery) || s.address.toLowerCase().includes(searchQuery);
      return matchCat && matchQ;
    });
    stores = all;
    totalCount = all.length;
  }

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-8 px-4 sm:px-0 space-y-7">
      {/* Toast Feedbacks */}
      {params.dihapus === "1" && (
        <div role="status" className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Icon name="check" size={16} />
          <span>Toko dan katalog produknya berhasil dihapus dari sistem.</span>
        </div>
      )}
      {params.kosong === "1" && (
        <div role="status" className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
          <Icon name="trash" size={16} />
          <span>Seluruh toko contoh telah dibersihkan. Anda dapat menambahkan toko riil secara manual.</span>
        </div>
      )}
      {params.contoh === "1" && (
        <div role="status" className="p-3.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 text-xs font-semibold flex items-center gap-2">
          <Icon name="sparkles" size={16} />
          <span>5 Toko contoh berhasil dimuat ke sistem untuk pengujian.</span>
        </div>
      )}

      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md">
            Portal Admin Toko Lokal
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            Dashboard Pengelola
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manajemen toko mitra, pemrosesan janji temu afiliasi, dan generator materi promosi QR code.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          <CatalogResetControls storeCount={totalCount} />
          <Link
            href="/portal/admin/kelola"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Icon name="plus" size={16} />
            <span>Tambah Toko Baru</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Mitra Terdaftar</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-slate-900">{totalCount}</span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">Toko</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Permohonan Afiliasi</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-teal-800">{bookingsCount}</span>
            <Link href="/portal/admin/kelola" className="text-[10px] font-bold text-teal-700 hover:underline">
              Kelola →
            </Link>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Kategori Usaha</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-slate-900">{categories.length}</span>
            <span className="text-[10px] font-medium text-slate-500">Sektor</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Alat Promosi QR</span>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl font-extrabold text-slate-900">Aktif</span>
            <Link href="/portal/admin/qr" className="text-[10px] font-bold text-teal-700 hover:underline">
              Buka QR →
            </Link>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form method="GET" action="/portal/admin" className="relative w-full sm:w-80">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
            <Icon name="search" size={16} />
          </span>
          <input
            name="q"
            defaultValue={params.q || ""}
            placeholder="Cari nama toko / alamat..."
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600 focus:border-teal-600"
          />
        </form>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto no-scrollbar">
          <Link
            href="/portal/admin"
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              !selectedCategory ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Semua
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/portal/admin?kategori=${c.id}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === c.id ? "bg-teal-700 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {c.name}
            </Link>
          ))}
        </div>
      </div>

      {/* Main Stores Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        {stores.length === 0 ? (
          <div className="py-14 px-4 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Icon name="store" size={26} />
            </div>
            <h3 className="text-base font-bold text-slate-900">Belum Ada Toko Terdaftar</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Katalog saat ini bersih dari toko dummy. Anda dapat menambahkan toko riil baru secara manual atau memuat data contoh untuk simulasi.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <Link
                href="/portal/admin/kelola"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold"
              >
                <Icon name="plus" size={14} />
                <span>Tambah Toko Pertama</span>
              </Link>
              <CatalogResetControls storeCount={0} />
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Nama Toko & Kategori</th>
                    <th className="py-3.5 px-4">Pengelola & Kontak</th>
                    <th className="py-3.5 px-4">Alamat & Pengiriman</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Aksi Manajemen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stores.map((store) => {
                    const catName = categories.find((c) => c.id === store.category_id)?.name ?? "Toko";
                    return (
                      <tr key={store.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4">
                          <Link
                            className="font-bold text-slate-900 hover:text-teal-700 transition-colors text-sm block"
                            href={`/toko/${store.slug}`}
                            target="_blank"
                          >
                            {store.name}
                          </Link>
                          <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-teal-50 text-teal-800 border border-teal-100">
                            {catName}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-slate-800">{store.manager_name || "Pemilik Toko"}</p>
                          {store.phone ? (
                            <a
                              href={`https://wa.me/${store.phone.replace(/[^0-9]/g, "")}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-emerald-700 hover:underline inline-flex items-center gap-1 mt-0.5 font-medium"
                            >
                              <Icon name="chat" size={12} />
                              <span>{store.phone}</span>
                            </a>
                          ) : (
                            <span className="text-slate-400 font-mono">-</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-slate-700 line-clamp-1">{store.address}</p>
                          <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-1">
                            {store.delivery_info || "Belum diatur"}
                          </p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            <span>Aktif</span>
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <Link
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
                              href={`/portal/admin/kelola?toko=${store.id}`}
                              title="Edit Data & Menu"
                            >
                              <Icon name="edit" size={13} />
                              <span>Edit</span>
                            </Link>

                            <Link
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
                              href={`/portal/admin/qr?qr=${store.id}`}
                              title="Buat QR Code Toko"
                            >
                              <Icon name="qrCode" size={13} />
                              <span>QR</span>
                            </Link>

                            <DeleteStoreButton storeId={store.id} storeName={store.name} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>Menampilkan {stores.length} dari {totalCount} toko</span>
              <div className="flex items-center gap-2">
                {page > 1 ? (
                  <Link
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50"
                    href={`/portal/admin?halaman=${page - 1}`}
                  >
                    Sebelumnya
                  </Link>
                ) : null}
                <span className="font-semibold text-slate-800">Halaman {page}</span>
                {page * 20 < totalCount ? (
                  <Link
                    className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50"
                    href={`/portal/admin?halaman=${page + 1}`}
                  >
                    Berikutnya
                  </Link>
                ) : null}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
