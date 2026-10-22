"use client";

import { useEffect, useRef, useState } from "react";
import { Photo } from "@/components/photo";

export function Gallery({ images, title }: { images: { url: string; alt: string }[]; title: string }) {
  const [index, setIndex] = useState(0);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const startX = useRef<number | null>(null);
  const current = images[index];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (!dialogRef.current?.open && event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      if (event.key === "ArrowRight") setIndex((value) => (value + 1) % images.length);
      if (event.key === "ArrowLeft") setIndex((value) => (value - 1 + images.length) % images.length);
      if (event.key === "Escape") dialogRef.current?.close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length]);

  if (!current) {
    return <div className="grid aspect-[4/3] place-items-center bg-panel text-muted">Fotografija še ni naložena.</div>;
  }

  const move = (direction: number) => setIndex((value) => (value + direction + images.length) % images.length);

  return (
    <div>
      <div
        className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-panel"
        onTouchStart={(event) => {
          startX.current = event.changedTouches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          if (startX.current == null) return;
          const delta = (event.changedTouches[0]?.clientX ?? startX.current) - startX.current;
          if (delta > 40) move(-1);
          if (delta < -40) move(1);
          startX.current = null;
        }}
      >
        <Photo src={current.url} alt={current.alt || title} sizes="(min-width: 1024px) 60vw, 100vw" priority />
        {images.length > 1 ? (
          <>
            <button type="button" className="absolute left-2 top-1/2 h-12 w-12 -translate-y-1/2 bg-ink/75 text-2xl text-white" onClick={() => move(-1)} aria-label="Prejšnja fotografija">
              ‹
            </button>
            <button type="button" className="absolute right-2 top-1/2 h-12 w-12 -translate-y-1/2 bg-ink/75 text-2xl text-white" onClick={() => move(1)} aria-label="Naslednja fotografija">
              ›
            </button>
          </>
        ) : null}
        <button type="button" className="absolute bottom-3 right-3 min-h-11 bg-ink/80 px-3 text-sm text-white" onClick={() => dialogRef.current?.showModal()}>
          Povečaj
        </button>
      </div>
      {images.length > 1 ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {images.map((image, imageIndex) => (
            <button
              key={image.url + imageIndex}
              type="button"
              className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border ${imageIndex === index ? "border-accent" : "border-transparent"}`}
              onClick={() => setIndex(imageIndex)}
              aria-label={`Fotografija ${imageIndex + 1}`}
              aria-current={imageIndex === index ? "true" : undefined}
            >
              <Photo src={image.url} alt="" sizes="80px" />
            </button>
          ))}
        </div>
      ) : null}
      <dialog ref={dialogRef} className="h-[100dvh] max-h-none w-screen max-w-none bg-ink p-0 text-white backdrop:bg-black/80" onClick={(event) => {
        if (event.target === dialogRef.current) dialogRef.current?.close();
      }}>
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 p-3">
            <p className="text-sm">{title}</p>
            <button type="button" className="h-12 min-w-12 border border-white/30 px-3" onClick={() => dialogRef.current?.close()} autoFocus>
              Zapri
            </button>
          </div>
          <div className="relative min-h-0 flex-1">
            <Photo src={current.url} alt={current.alt || title} sizes="100vw" />
          </div>
          {images.length > 1 ? (
            <div className="grid grid-cols-2 gap-2 p-3">
              <button type="button" className="btn btn-line" onClick={() => move(-1)}>Prejšnja</button>
              <button type="button" className="btn btn-line" onClick={() => move(1)}>Naslednja</button>
            </div>
          ) : null}
        </div>
      </dialog>
    </div>
  );
}
