import Link from "next/link";
import { PhotoFrame } from "@/components/photo";
import { CompareActions } from "@/components/compare-button";
import { coverOf, type PublicBike } from "@/lib/motorcycles";
import { conditionLabel, displayName, formatCc, formatKm, formatPrice, statusLabel } from "@/lib/utils";

export function MotoCard({ bike, hrefBase = "/motorji" }: { bike: PublicBike; hrefBase?: string }) {
  const cover = coverOf(bike);
  const name = displayName(bike);
  const href = `${hrefBase}/${bike.slug}`;
  const specs = [String(bike.year), formatKm(bike.mileageKm), formatCc(bike.engineCc)].filter(Boolean);
  return (
    <article className="moto-card flex h-full flex-col border border-black/10 bg-white text-ink">
      <div className="relative">
        <Link href={href} className="block">
          <PhotoFrame src={cover?.url} alt={cover?.alt || name} sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw" />
        </Link>
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          {conditionLabel(bike.condition) ? <Badge>{conditionLabel(bike.condition)}</Badge> : null}
          {bike.status !== "AVAILABLE" ? <Badge>{statusLabel(bike.status)}</Badge> : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4 sm:p-5">
        <div>
          <h3 className="display text-3xl leading-none text-ink">{name}</h3>
          <p className="mt-2 text-sm text-ink/70">{specs.join(" · ") || "Podatki so navedeni na podrobni strani."}</p>
          {bike.description ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-ink/75">{bike.description}</p> : null}
        </div>
        <p className="display text-2xl text-ink">{formatPrice(bike.priceCents, bike.priceConfirmed)}</p>
        <div className="mt-auto grid gap-2">
          <Link href={href} className="btn btn-dark min-h-11 w-full px-3 text-base">
            Podrobnosti
          </Link>
          <CompareActions id={bike.id} />
        </div>
      </div>
    </article>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-ink/85 px-2.5 py-1 text-[0.68rem] uppercase tracking-[0.14em] text-white">{children}</span>;
}
