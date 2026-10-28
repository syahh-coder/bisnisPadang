"use client";
import { useEffect, useRef, useState } from "react";

export function ProductThumbnail({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const image = useRef<HTMLImageElement>(null);
  useEffect(() => { if (image.current?.complete && image.current.naturalWidth === 0) setFailed(true); }, [src]);
  if (!src || failed) return null;
  return <img ref={image} src={src} alt={`Foto menu ${name}`} width={48} height={48} loading="lazy" decoding="async" className="product-thumbnail" onError={() => setFailed(true)} />;
}
