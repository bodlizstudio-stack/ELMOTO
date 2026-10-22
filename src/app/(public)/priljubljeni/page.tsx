import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Priljubljeni motorji",
  description: "Shranjevanje med priljubljene ni na voljo. Motorje lahko primerjate.",
  robots: { index: false },
};

export default function FavoritesPage() {
  return (
    <section className="bg-paper py-16 text-ink">
      <div className="wrap max-w-3xl">
        <h1 className="display text-5xl sm:text-7xl">Priljubljeni motorji</h1>
        <p className="mt-6 max-w-xl leading-7">
          Shranjevanje med priljubljene ni na voljo. Motorje lahko primerjate, največ tri naenkrat.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link className="btn btn-dark" href="/motorji">
            Motorji za prodajo
          </Link>
          <Link className="btn btn-dark" href="/primerjava">
            Primerjava
          </Link>
        </div>
      </div>
    </section>
  );
}
