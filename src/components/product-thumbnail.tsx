"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";

export function ProductThumbnail({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const image = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (image.current?.complete && image.current.naturalWidth === 0) {
      setFailed(true);
    }
  }, [src]);

  if (src && !failed) {
    return (
      <img
        ref={image}
        src={src}
        alt={`Foto ${name}`}
        width={56}
        height={56}
        loading="lazy"
        decoding="async"
        className="w-14 h-14 rounded-xl object-cover border border-slate-200/80 shadow-xs shrink-0"
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className="w-14 h-14 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center shrink-0 border border-slate-200/60"
      aria-hidden="true"
    >
      <Icon name="shoppingBag" size={20} />
    </div>
  );
}
