import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CompareActions } from "@/components/compare-button";
import { PhotoFrame } from "@/components/photo";
import { coverOf, rentalBikes } from "@/lib/motorcycles";
import { lowestDailyCents } from "@/lib/rental";
import { displayName, formatCc, formatPrice, lines } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Najem motorjev",
  description: "Najem motorjev pri EL-MOTO v Trzinu, blizu Ljubljane. Pošljite povpraševanje za termin. Rezervacija je potrjena šele po potrditvi podjetja.",
  alternates: { canonical: "/najem" },
};

export default async function RentalPage() {
  const bikes = await rentalBikes();
  return (
    <section className="bg-paper py-8 text-ink sm:py-12">
      <div className="wrap">
        <Breadcrumbs items={[{ href: "/", label: "Domov" }, { label: "Najem" }]} />
        <h1 className="display mt-4 text-5xl sm:text-7xl">Najem motorjev — svoboda brez meja</h1>
        <p className="mt-4 max-w-2xl text-lg leading-7">Izberi motor, določi termin in pošlji povpraševanje za svojo naslednjo avanturo.</p>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/70">Prikazani so samo motorji, ki so označeni kot na voljo za najem. Oddaja obrazca ni samodejna rezervacija in ne vključuje spletnega plačila.</p>
        {bikes.length ? (
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {bikes.map((bike) => {
              const daily = lowestDailyCents(bike.rentalRates);
              const equipment = lines(bike.equipment).slice(0, 4);
              return (
                <article key={bike.id} className="flex h-full flex-col border border-black/10 bg-white">
                  <PhotoFrame src={coverOf(bike)?.url} alt={displayName(bike)} sizes="(min-width: 1024px) 30vw, 100vw" />
                  <div className="flex flex-1 flex-col p-4">
                    <h2 className="display text-3xl">{displayName(bike)}</h2>
                    <p className="mt-2 text-sm text-ink/70">{[bike.year, formatCc(bike.engineCc), bike.category].filter(Boolean).join(" · ")}</p>
                    {bike.description ? <p className="mt-3 line-clamp-4 leading-7">{bike.description}</p> : null}
                    {equipment.length ? (
                      <ul className="mt-3 list-disc pl-5 text-sm leading-6">
                        {equipment.map((item) => (
                          <li key={item}>{item}</li>
                        ))}
                      </ul>
                    ) : null}
                    <p className="mt-4">{daily ? `od ${formatPrice(daily, true)} / dan` : "Cena na povpraševanje"}</p>
                    <p className="text-sm text-ink/60">Na voljo za povpraševanje</p>
                    <Link className="btn btn-dark mt-4 w-full" href={`/najem/${bike.slug}`}>
                      Preveri termin
                    </Link>
                    <div className="mt-2">
                      <CompareActions id={bike.id} />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-8 border border-black/10 bg-white p-6">
            <h2 className="display text-4xl">Najem trenutno ni objavljen</h2>
            <p className="mt-3 leading-7">Ko bo motor označen za najem, se bo prikazal tukaj. Za informacijo nas lahko pokličete ali pišete.</p>
            <Link className="btn btn-dark mt-5" href="/kontakt">Kontakt</Link>
          </div>
        )}
      </div>
    </section>
  );
}
