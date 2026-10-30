"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/icon";

export function StorePhoto({ src, name }: { src: string | null; name: string }) {
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const image = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (image.current?.complete) {
      if (image.current.naturalWidth === 0) {
        setFailed(true);
      } else {
        setLoaded(true);
      }
    }
  }, [src]);

  return (
    <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs">
      {src && !failed ? (
        <>
          {!loaded && (
            <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center text-slate-400">
              <Icon name="store" size={32} />
            </div>
          )}
          <img
            ref={image}
            src={src}
            alt={`Foto ${name}`}
            className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
            decoding="async"
            onLoad={() => setLoaded(true)}
            onError={() => setFailed(true)}
          />
        </>
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-slate-100 to-slate-200 text-slate-400 p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white shadow-xs flex items-center justify-center text-teal-700 mb-2">
            <Icon name="store" size={28} />
          </div>
          <span className="text-xs font-semibold text-slate-600">{name}</span>
          <span className="text-[11px] text-slate-400 mt-0.5">Foto resmi toko</span>
        </div>
      )}
    </div>
  );
}
