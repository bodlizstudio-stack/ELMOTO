import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { CompareActions } from "@/components/compare-button";
import { Gallery } from "@/components/gallery";
import { RentalForm } from "@/components/rental-form";
import { prisma } from "@/lib/db";
import { getBikeBySlug, rentalBikes } from "@/lib/motorcycles";
import { getPage } from "@/lib/settings";
import { displayName, formatCc, formatPrice, lines } from "@/lib/utils";
import { lowestDailyCents } from "@/lib/rental";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const bike = await getBikeBySlug(slug);
  if (!bike?.forRent) return { title: "Najem ni na voljo" };
  return {
    title: `Najem: ${displayName(bike)}`,
    description: `Povpraševanje za najem motorja ${displayName(bike)} pri EL-MOTO v Trzinu.`,
    alternates: { canonical: `/najem/${bike.slug}` },
  };
}

export default async function RentalDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bike = await getBikeBySlug(slug);
  if (!bike || !bike.forRent || bike.status !== "AVAILABLE") notFound();
  const [bikes, blocks, terms] = await Promise.all([
    rentalBikes(),
    prisma.rentalBlock.findMany({ where: { motorcycleId: bike.id } }),
    getPage("pogoji-najema"),
  ]);
  const confirmedBookings = await prisma.rentalBooking.findMany({
    where: { motorcycleId: bike.id, status: "CONFIRMED" },
    select: { pickupAt: true, returnAt: true },
  });
  const daily = lowestDailyCents(bike.rentalRates);
  const rate = bike.rentalRates.find((item) => item.confirmed) ?? bike.rentalRates[0];
  const name = displayName(bike);

  return (
    <article className="bg-paper py-8 text-ink">
      <div className="wrap">
        <Breadcrumbs items={[{ href: "/", label: "Domov" }, { href: "/najem", label: "Najem" }, { label: name }]} />
        <div className="mt-6 grid gap-8 lg:grid-cols-2">
          <div>
            <Gallery images={bike.images.map((image) => ({ url: image.url, alt: image.alt || name }))} title={name} />
            <h1 className="display mt-6 text-5xl">{name}</h1>
            <p className="mt-3 text-ink/70">{[bike.year, formatCc(bike.engineCc), bike.category].filter(Boolean).join(" · ")}</p>
            <p className="mt-3">{daily ? `od ${formatPrice(daily, true)} / dan` : "Cena na povpraševanje"}</p>
            <div className="mt-4 max-w-sm">
              <CompareActions id={bike.id} />
            </div>
            {bike.description ? <p className="prose-copy mt-4">{bike.description}</p> : null}
            {lines(bike.equipment).length ? (
              <>
                <h2 className="display mt-6 text-3xl">Vključena oprema</h2>
                <ul className="mt-2 list-disc pl-5">
                  {lines(bike.equipment).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </>
            ) : null}
            {rate?.confirmed && (rate.depositCents || rate.kmLimitPerDay || rate.extrasNote) ? (
              <div className="mt-4 text-sm leading-6">
                {rate.depositCents ? <p>Varščina: {formatPrice(rate.depositCents, true)}</p> : null}
                {rate.kmLimitPerDay ? <p>Omejitev: {rate.kmLimitPerDay} km / dan</p> : null}
                {rate.extraKmCents ? <p>Dodatni kilometer: {formatPrice(rate.extraKmCents, true)}</p> : null}
                {rate.extrasNote ? <p>{rate.extrasNote}</p> : null}
              </div>
            ) : null}
          </div>
          <div className="bg-white p-4 sm:p-6">
            <h2 className="display text-4xl">Preveri termin</h2>
            <RentalForm
              initialMotorcycleId={bike.id}
              motorcycles={bikes.map((item) => ({ id: item.id, label: displayName(item) }))}
              rates={bike.rentalRates.map((item) => ({
                dailyCents: item.dailyCents,
                weekendCents: item.weekendCents,
                multidayCents: item.multidayCents,
                seasonStart: item.seasonStart,
                seasonEnd: item.seasonEnd,
                confirmed: item.confirmed,
              }))}
              blocks={[
                ...blocks.map((block) => ({ start: block.startAt.toISOString(), end: block.endAt.toISOString() })),
                ...confirmedBookings.map((booking) => ({ start: booking.pickupAt.toISOString(), end: booking.returnAt.toISOString() })),
              ]}
              termsConfirmed={Boolean(terms?.confirmed)}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
