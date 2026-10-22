import Link from "next/link";
import { prisma } from "@/lib/db";
import { displayName, formatPrice, statusLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminMotorcycles({ searchParams }: { searchParams: Promise<{ deleted?: string }> }) {
  const params = await searchParams;
  const bikes = await prisma.motorcycle.findMany({ orderBy: { updatedAt: "desc" }, include: { images: true } });
  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="display text-5xl">Motorji</h1>
        <Link className="btn btn-primary" href="/admin/motorji/nov">Dodaj motor</Link>
      </div>
      {params.deleted ? <p className="mt-4 text-sm text-accent">Motor je izbrisan.</p> : null}
      <div className="mt-6 grid gap-3">
        {bikes.map((bike) => (
          <article key={bike.id} className="grid gap-2 bg-panel p-4 sm:grid-cols-[1fr_auto] sm:items-center">
            <div>
              <h2 className="text-lg">{displayName(bike)}</h2>
              <p className="text-sm text-muted">
                {bike.year} · {statusLabel(bike.status)} · {formatPrice(bike.priceCents, bike.priceConfirmed)} · fotografij: {bike.images.length}
                {bike.forRent ? " · najem" : ""}
              </p>
            </div>
            <Link className="btn btn-line" href={`/admin/motorji/${bike.id}`}>Uredi</Link>
          </article>
        ))}
        {!bikes.length ? <p className="text-muted">Ni motorjev. Dodajte prvega ali uvozite CSV/JSON.</p> : null}
      </div>
    </section>
  );
}
