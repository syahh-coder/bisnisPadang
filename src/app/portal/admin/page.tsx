import Link from "next/link";
import { adminClient, pageNumber } from "@/lib/admin";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ halaman?: string }> }) {
  const page = pageNumber((await searchParams).halaman);
  const client = await adminClient();
  const result = await client.from("stores").select("id,name,slug,manager_name,owner_id,phone,address,delivery_info,category_id", { count: "exact" }).order("created_at", { ascending: false }).order("id").range((page - 1) * 20, page * 20 - 1);
  const ids = (result.data ?? []).map((s) => s.owner_id).filter(Boolean);
  const profiles = ids.length ? await client.from("profiles").select("id,name").in("id", ids) : null;
  const categories = await client.from("categories").select("id,name");
  return <section className="page-view"><div className="page-heading"><h1>Portal Admin</h1><p>Daftar toko yang sudah bergabung.</p></div>
    {result.error || profiles?.error || categories.error ? <p role="alert" className="notice">Daftar toko belum dapat dimuat. Coba muat ulang.</p> : <><div className="section-toolbar"><h2 className="section-title">Daftar toko <span className="muted">({result.count ?? 0})</span></h2><Link className="text-link" href="/portal/admin/kelola">Tambah toko</Link></div>
      {!result.data?.length ? <p className="notice">Belum ada toko di halaman ini.</p> : <div className="table-scroll" role="region" aria-label="Daftar toko" tabIndex={0}><table className="data-table"><thead><tr><th>Toko</th><th>Pemilik & kontak</th><th>Data toko</th><th><span className="sr-only">Aksi</span></th></tr></thead><tbody>{result.data.map((store) => <tr key={store.id}><td><Link className="text-link" href={`/toko/${store.slug}`}>{store.name}</Link><p className="muted">{categories.data?.find((c) => c.id === store.category_id)?.name}</p></td><td>{store.manager_name || profiles?.data?.find((p) => p.id === store.owner_id)?.name || "Belum diisi"}<p>{store.phone || "Nomor belum diisi"}</p><p className="muted">{store.owner_id ? "Akun ditautkan" : "Akun belum ditautkan"}</p></td><td>{store.address}<p className="muted">{store.delivery_info || "Info delivery belum diisi"}</p></td><td><Link className="text-link" href={`/portal/admin/kelola?toko=${store.id}`}>Edit</Link></td></tr>)}</tbody></table></div>}
      <div className="pagination">{page > 1 && <Link className="button" href={`/portal/admin?halaman=${page - 1}`}>Sebelumnya</Link>}<span>Halaman {page}</span>{page * 20 < (result.count ?? 0) && <Link className="button" href={`/portal/admin?halaman=${page + 1}`}>Berikutnya</Link>}</div>
    </>}
  </section>;
}
