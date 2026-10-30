import Link from "next/link";
import { adminClient, pageNumber } from "@/lib/admin";
import { demoCategories } from "@/lib/catalog/demo";
import { Icon } from "@/components/icon";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ halaman?: string }>;
}) {
  const page = pageNumber((await searchParams).halaman);
  let stores: any[] = [];
  let totalCount = 0;
  let categories: any[] = demoCategories;

  try {
    const client = await adminClient();
    const result = await client
      .from("stores")
      .select("id,name,slug,manager_name,owner_id,phone,address,delivery_info,category_id", { count: "exact" })
      .order("created_at", { ascending: false })
      .order("id")
      .range((page - 1) * 20, page * 20 - 1);

    if (!result.error && result.data && result.data.length > 0) {
      stores = result.data;
      totalCount = result.count ?? stores.length;
      const catRes = await client.from("categories").select("id,name");
      if (catRes.data) categories = catRes.data;
    }
  } catch {
    // demo fallback
  }

  // Fallback to demo stores
  if (stores.length === 0) {
    stores = [
      {
        id: "00000000-0000-4000-8000-000000000101",
        name: "Warung Bu Ani",
        slug: "warung-bu-ani",
        manager_name: "Ibu Ani",
        owner_id: "00000000-0000-4000-8000-000000000101",
        phone: "081267891234",
        address: "Jl. Andalas No. 12, Padang",
        delivery_info: "Delivery radius 5 km",
        category_id: "00000000-0000-4000-8000-000000000001",
      },
      {
        id: "00000000-0000-4000-8000-000000000102",
        name: "Kopi Sudut Padang",
        slug: "kopi-sudut",
        manager_name: "Rian Pratama",
        owner_id: null,
        phone: "081398765432",
        address: "Jl. Ahmad Yani No. 5, Padang",
        delivery_info: "Delivery via ojek online",
        category_id: "00000000-0000-4000-8000-000000000002",
      },
      {
        id: "00000000-0000-4000-8000-000000000103",
        name: "Laundry Cepat Berkah",
        slug: "laundry-cepat",
        manager_name: "Siti Rahma",
        owner_id: null,
        phone: "082155554321",
        address: "Jl. Veteran No. 20, Padang",
        delivery_info: "Antar jemput gratis",
        category_id: "00000000-0000-4000-8000-000000000003",
      },
      {
        id: "00000000-0000-4000-8000-000000000104",
        name: "Toko Sembako Jaya",
        slug: "toko-sembako-jaya",
        manager_name: "Pak Hendra",
        owner_id: null,
        phone: "081912345678",
        address: "Jl. Pasar Raya No. 3, Padang",
        delivery_info: "Belum melayani delivery",
        category_id: "00000000-0000-4000-8000-000000000004",
      },
      {
        id: "00000000-0000-4000-8000-000000000105",
        name: "Bakso Mang Ujang",
        slug: "bakso-mang-ujang",
        manager_name: "Mang Ujang",
        owner_id: null,
        phone: "085233334444",
        address: "Jl. Gajah Mada No. 8, Padang",
        delivery_info: "Delivery radius 3 km",
        category_id: "00000000-0000-4000-8000-000000000001",
      },
    ];
    totalCount = stores.length;
  }

  return (
    <div className="max-w-4xl mx-auto py-6 sm:py-8 px-4 sm:px-0 space-y-6">
      {/* Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2.5 py-1 rounded-md">
            Portal Admin
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            Daftar Toko & Mitra UMKM
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola {totalCount} usaha yang telah terdaftar dalam sistem Toko Lokal Padang.
          </p>
        </div>

        <Link
          href="/portal/admin/kelola"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold shadow-sm transition-colors self-start sm:self-auto"
        >
          <Icon name="plus" size={16} />
          <span>Tambah Toko Baru</span>
        </Link>
      </div>

      {/* Stores Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Nama Toko</th>
                <th className="py-3.5 px-4">Pengelola & Kontak</th>
                <th className="py-3.5 px-4">Alamat & Pengiriman</th>
                <th className="py-3.5 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stores.map((store) => {
                const catName = categories.find((c) => c.id === store.category_id)?.name ?? "Toko";
                return (
                  <tr key={store.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4">
                      <Link
                        className="font-bold text-slate-900 hover:text-teal-700 transition-colors text-sm"
                        href={`/toko/${store.slug}`}
                        target="_blank"
                      >
                        {store.name}
                      </Link>
                      <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600">
                        {catName}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{store.manager_name || "Belum diisi"}</p>
                      <p className="font-mono text-slate-500 mt-0.5">{store.phone || "-"}</p>
                      <span
                        className={`inline-block mt-1 text-[10px] font-medium ${
                          store.owner_id ? "text-emerald-700 font-semibold" : "text-amber-700"
                        }`}
                      >
                        {store.owner_id ? "● Akun Ditautkan" : "○ Belum Ditautkan"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-slate-700 line-clamp-1">{store.address}</p>
                      <p className="text-slate-400 text-[11px] mt-0.5 line-clamp-1">
                        {store.delivery_info || "Belum diatur"}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 text-xs font-semibold transition-colors"
                        href={`/portal/admin/kelola?toko=${store.id}`}
                      >
                        <Icon name="edit" size={13} />
                        <span>Edit</span>
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {stores.length} toko</span>
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
      </div>
    </div>
  );
}
