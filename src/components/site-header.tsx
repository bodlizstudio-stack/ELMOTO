"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { LogoLink } from "@/components/logo";
import { navItems, site } from "@/lib/site";

function active(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = panelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>("a, button");
    focusable?.[0]?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="brand-rule sticky top-0 z-50 bg-ink">
      <div className="wrap flex h-16 items-center justify-between gap-3">
        <LogoLink className="h-9 w-auto sm:h-11" />
        <nav aria-label="Glavna navigacija" className="hidden items-center gap-4 xl:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active(pathname, item.href) ? "page" : undefined}
              className={`whitespace-nowrap text-[0.78rem] uppercase tracking-[0.14em] ${active(pathname, item.href) ? "text-brand" : "text-white/85 hover:text-white"}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Link href="/motorji" className="btn btn-primary hidden px-4 xl:inline-flex">
            Preveri ponudbo
          </Link>
          <button
            ref={buttonRef}
            type="button"
            className="inline-flex h-12 w-12 items-center justify-center border border-white/20 xl:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X aria-hidden /> : <Menu aria-hidden />}
            <span className="sr-only">{open ? "Zapri meni" : "Odpri meni"}</span>
          </button>
        </div>
      </div>
      <div
        id="mobile-nav"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        hidden={!open}
        className={`mobile-menu fixed inset-x-0 bottom-0 top-16 z-50 overflow-y-auto bg-ink px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 xl:hidden ${open ? "open" : ""}`}
      >
        <p id={titleId} className="sr-only">
          Mobilni meni
        </p>
        <Link href="/motorji" className="btn btn-primary mb-4 w-full" onClick={() => setOpen(false)}>
          Preveri ponudbo
        </Link>
        <nav aria-label="Mobilna navigacija" className="grid">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active(pathname, item.href) ? "page" : undefined}
              className={`border-b border-white/10 py-4 text-2xl display ${active(pathname, item.href) ? "text-brand" : "text-white"}`}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="mt-6 grid gap-3 text-sm text-muted">
          <a className="btn btn-line w-full" href={`tel:${site.phoneTel}`}>
            Pokliči {site.phoneDisplay}
          </a>
          <Link href="/primerjava" className="underline" onClick={() => setOpen(false)}>
            Primerjava
          </Link>
        </div>
      </div>
    </header>
  );
}
