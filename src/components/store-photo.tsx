"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";

export function StorePhoto({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => {
    // Gambar SSR bisa gagal sebelum React memasang handler onError.
    if (image.current?.complete && image.current.naturalWidth === 0) setFailed(true);
  }, [src]);
  return (
    <div className="store-photo">
      {src && !failed ? (
        <img ref={image} src={src} alt={`Foto ${name}`} width="720" height="360" decoding="async" onError={() => setFailed(true)} />
      ) : (
        <div className="store-photo-empty"><Icon name="store" /><span>Foto belum tersedia</span></div>
      )}
    </div>
  );
}
