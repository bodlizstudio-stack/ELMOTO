import Link from "next/link";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main id="vsebina" className="grid min-h-[70svh] place-items-center bg-ink px-4 py-16 text-center">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-brand">404</p>
          <h1 className="display mt-3 text-6xl sm:text-8xl">Stran ni najdena</h1>
          <p className="mx-auto mt-4 max-w-md text-muted">Naslov ne obstaja ali oglas ni več objavljen.</p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link className="btn btn-primary" href="/">Domov</Link>
            <Link className="btn btn-line" href="/motorji">Motorji</Link>
          </div>
        </div>
      </main>
    </>
  );
}
