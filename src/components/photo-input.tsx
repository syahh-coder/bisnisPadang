"use client";

import { MAX_PHOTO_BYTES } from "@/lib/media";

export function PhotoInput() {
  return <input name="photo" type="file" required accept="image/jpeg,image/png,image/webp,image/avif,image/gif" onChange={(event) => {
    const input = event.currentTarget;
    input.setCustomValidity((input.files?.[0]?.size ?? 0) > MAX_PHOTO_BYTES ? "Ukuran foto maksimal 4 MB. Pilih berkas yang lebih kecil." : "");
  }} />;
}
