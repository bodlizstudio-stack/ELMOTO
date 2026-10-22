"use client";

import { useEffect, useRef, useState } from "react";

type Consent = { necessary: true; analytics: false };

const KEY = "elmoto-consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const bannerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stored = localStorage.getItem(KEY);
    setVisible(!stored);
    const open = () => {
      const dialog = document.getElementById("cookie-dialog") as HTMLDialogElement | null;
      dialog?.showModal();
    };
    window.addEventListener("elmoto-cookie-settings", open);
    return () => window.removeEventListener("elmoto-cookie-settings", open);
  }, []);

  useEffect(() => {
    const el = bannerRef.current;
    if (!visible || !el) {
      document.documentElement.style.setProperty("--cookie-space", "0px");
      return;
    }
    const sync = () => document.documentElement.style.setProperty("--cookie-space", `${el.offsetHeight + 12}px`);
    sync();
    const observer = new ResizeObserver(sync);
    observer.observe(el);
    return () => observer.disconnect();
  }, [visible]);

  if (!visible) return <CookieDialog />;

  return (
    <>
      <div ref={bannerRef} className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-ink text-white dock">
        <div className="wrap flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs leading-5 text-muted">
            Uporabljamo samo nujne podatke v tem brskalniku: izbiro piškotkov in primerjavo motorjev. Analitika ni vklopljena.
          </p>
          <div className="flex gap-2">
            <button type="button" className="btn btn-primary min-w-0 flex-1 px-3 sm:flex-none" onClick={() => save(setVisible)}>
              Razumem
            </button>
            <button type="button" className="btn btn-line min-w-0 flex-1 px-3 sm:flex-none" onClick={() => (document.getElementById("cookie-dialog") as HTMLDialogElement | null)?.showModal()}>
              Nastavitve
            </button>
          </div>
        </div>
      </div>
      <CookieDialog onSave={() => setVisible(false)} />
    </>
  );
}

function save(setVisible: (value: boolean) => void) {
  const value: Consent = { necessary: true, analytics: false };
  localStorage.setItem(KEY, JSON.stringify(value));
  document.documentElement.style.setProperty("--cookie-space", "0px");
  setVisible(false);
  (document.getElementById("cookie-dialog") as HTMLDialogElement | null)?.close();
}

function CookieDialog({ onSave }: { onSave?: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <dialog id="cookie-dialog" ref={ref} className="w-[min(100%-1.5rem,32rem)] bg-paper p-5 text-ink">
      <h2 className="display text-4xl">Nastavitve piškotkov</h2>
      <p className="mt-3 text-sm leading-6">Nujni zapis v brskalniku je vedno vklopljen, ker shrani vašo izbiro. Analitični in marketinški piškotki niso nameščeni.</p>
      <label className="mt-4 flex items-center gap-3 text-sm">
        <input type="checkbox" checked readOnly className="h-5 w-5" />
        Nujno
      </label>
      <label className="mt-2 flex items-center gap-3 text-sm text-ink/60">
        <input type="checkbox" disabled className="h-5 w-5" />
        Analitika, trenutno ni na voljo
      </label>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row">
        <button type="button" className="btn btn-dark" onClick={() => { save(onSave ?? (() => undefined)); }}>
          Shrani izbiro
        </button>
        <button type="button" className="btn btn-line btn-ink" onClick={() => ref.current?.close()}>
          Zapri
        </button>
      </div>
    </dialog>
  );
}

export function CookieSettingsButton() {
  return (
    <button type="button" className="text-left underline" onClick={() => window.dispatchEvent(new Event("elmoto-cookie-settings"))}>
      Nastavitve piškotkov
    </button>
  );
}
