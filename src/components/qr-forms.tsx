"use client";
import { useActionState, useState } from "react";
import { createQR, updateQRExpiry } from "@/app/portal/admin/qr/actions";
import { wibMinute, qrMax } from "@/lib/qr/format";
import type { Choice } from "@/lib/admin";

export function CreateQRForm({ stores, now }: { stores: Choice[]; now: string }) {
  const [state, action, pending] = useActionState(createQR, {});
  const [kind, setKind] = useState("static");
  const [store, setStore] = useState("");
  const [expires, setExpires] = useState(wibMinute(Date.parse(now) + 86400000));
  return <form action={action} className="editor-form" aria-label="Buat QR"><label>Toko<select name="store_id" required value={store} onChange={(e) => setStore(e.target.value)}><option value="">Pilih toko</option>{stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><label>Jenis QR<select name="kind" value={kind} onChange={(e) => setKind(e.target.value)}><option value="static">Statis</option><option value="dynamic">Dinamis</option></select></label>{kind === "dynamic" ? <label>Berakhir pada (WIB)<input name="expires_at" type="datetime-local" required min={wibMinute(Date.parse(now) + 60000)} max={wibMinute(Date.parse(now) + 15 * 86400000)} value={expires} onChange={(e) => setExpires(e.target.value)} /><span className="form-hint">Pilih tanggal dan jam, maksimal 15 hari sejak dibuat. Setiap QR memiliki masa berlaku sendiri.</span></label> : <p className="form-hint">QR statis langsung membuka alamat halaman toko dan tidak kedaluwarsa. Jika slug toko berubah, buat QR statis baru.</p>}{state.error && <p role="alert">{state.error}</p>}<button className="button button--primary" disabled={pending || !stores.length}>{pending ? "Membuat…" : "Buat QR"}</button></form>;
}
export function QRExpiryForm({ id, createdAt, expiresAt, now }: { id: string; createdAt: string; expiresAt: string; now: string }) {
  const [state, action, pending] = useActionState(updateQRExpiry.bind(null, id), {});
  const [value, setValue] = useState(wibMinute(expiresAt));
  const limit = qrMax(createdAt);
  if (limit <= Date.parse(now) + 60000) return <p className="form-hint">Batas 15 hari sejak pembuatan sudah lewat. Buat QR dinamis baru jika diperlukan.</p>;
  return <form action={action} className="editor-form" aria-label="Ubah masa berlaku QR"><label>Berakhir pada (WIB)<input type="datetime-local" name="expires_at" required min={wibMinute(Date.parse(now) + 60000)} max={wibMinute(limit)} value={value} onChange={(e) => setValue(e.target.value)} /></label><p className="form-hint">Batas maksimum mengikuti tanggal pembuatan QR, bukan tanggal pengubahan.</p>{state.error && <p role="alert">{state.error}</p>}{state.success && <p role="status">{state.success}</p>}<button className="button" disabled={pending}>{pending ? "Menyimpan…" : "Simpan masa berlaku"}</button></form>;
}
