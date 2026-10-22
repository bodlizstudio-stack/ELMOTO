import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactForm } from "@/components/contact-form";
import { CompareActions } from "@/components/compare-button";
import { Gallery } from "@/components/gallery";
import { MotoCard } from "@/components/moto-card";
import { ShareButton } from "@/components/share-button";
import { getBikeBySlug, publicChoices, relatedBikes } from "@/lib/motorcycles";
import { getSettings } from "@/lib/settings";
import { siteUrl } from "@/lib/site";
import { conditionLabel, displayName, factualSummary, formatCc, formatKm, formatPower, formatPrice, lines, statusLabel, stockLabel } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const bike = await getBikeBySlug(slug);
  if (!bike) return { title: "Motor ni na voljo" };
  const name = displayName(bike);
  const title = bike.seoTitle || (bike.status === "SOLD" ? `${name} (prodano)` : name);
  const description = bike.seoDescription || factualSummary(bike);
  return {
    title,
    description,
    alternates: { canonical: `/motorji/${bike.slug}` },
    openGraph: { title, description, url: `/motorji/${bike.slug}` },
  };
}

export default async function MotorcyclePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const bike = await getBikeBySlug(slug);
  if (!bike || !bike.forSale) notFound();
  const [related, settings, choices] = await Promise.all([relatedBikes(bike), getSettings(), publicChoices()]);
  const name = displayName(bike);
  const sold = bike.status === "SOLD";
  const rows = [
    ["Znamka", bike.brand],
    ["Model", bike.model],
    ["Različica", bike.variant],
    ["Letnik", String(bike.year)],
    ["Stanje", conditionLabel(bike.condition)],
    ["Kilometri", formatKm(bike.mileageKm) || ""],
    ["Prostornina", formatCc(bike.engineCc) || ""],
    ["Moč", formatPower(bike.powerKw, bike.powerHp) || ""],
    ["Tip motorja", bike.engineType],
    ["Menjalnik", bike.transmission],
    ["Tip pogona", bike.driveType],
    ["Barva", bike.color],
    ["Kategorija dovoljenja", bike.licenseCategory],
    ["Zaloga", stockLabel(bike.status)],
  ].filter(([, value]) => value);
  const equipment = lines(bike.equipment);
  const offer = bike.priceConfirmed && bike.priceCents && bike.priceCents > 0
    ? {
        "@type": "Offer",
        priceCurrency: "EUR",
        price: (bike.priceCents / 100).toFixed(2),
        availability: sold
          ? "https://schema.org/SoldOut"
          : bike.status === "RESERVED"
            ? "https://schema.org/LimitedAvailability"
            : "https://schema.org/InStock",
      }
    : undefined;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description: bike.description || factualSummary(bike),
    brand: { "@type": "Brand", name: bike.brand },
    category: bike.category || undefined,
    image: bike.images.map((image) => (image.url.startsWith("http") ? image.url : `${siteUrl()}${image.url}`)),
    offers: offer,
  };

  return (
    <article className="bg-paper pb-28 text-ink md:pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="wrap py-8">
        <Breadcrumbs items={[{ href: "/", label: "Domov" }, { href: "/motorji", label: "Motorji" }, { label: name }]} />
        <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)]">
          <Gallery images={bike.images.map((image) => ({ url: image.url, alt: image.alt || name }))} title={name} />
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-accent">{statusLabel(bike.status)}</p>
            <h1 className="display mt-2 text-5xl sm:text-6xl">{name}</h1>
            <p className="mt-4 display text-4xl">{formatPrice(bike.priceCents, bike.priceConfirmed)}</p>
            {sold ? (
              <p className="mt-4 border border-black/10 bg-white p-4 leading-7">To vozilo je prodano in ni več na voljo za nakup.</p>
            ) : bike.status === "RESERVED" ? (
              <p className="mt-4 border border-black/10 bg-white p-4 leading-7">Vozilo je označeno kot rezervirano. Povpraševanje lahko vseeno pošljete.</p>
            ) : null}
            <dl className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {rows.map(([label, value]) => (
                <div key={label} className="border-b border-black/10 pb-2">
                  <dt className="text-xs uppercase tracking-[0.12em] text-ink/50">{label}</dt>
                  <dd className="mt-1">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-6">
              <CompareActions id={bike.id} />
            </div>
            <div className="mt-6 hidden flex-col gap-3 md:flex">
              {!sold ? (
                <>
                  <a className="btn btn-primary w-full" href="#povprasevanje">Pošlji povpraševanje</a>
                  <a className="btn btn-dark w-full" href="#povprasevanje">Dogovori se za ogled</a>
                </>
              ) : (
                <Link className="btn btn-dark w-full" href="/motorji">Poglej druge motorje</Link>
              )}
              <a className="btn btn-dark w-full" href={`tel:${settings.phoneTel}`}>Pokliči prodajalca</a>
              <ShareButton title={name} />
            </div>
          </div>
        </div>

        <section className="mt-12 max-w-3xl">
          <h2 className="display text-4xl">Opis motorja</h2>
          {bike.description ? (
            <p className="prose-copy mt-4">{bike.description}</p>
          ) : (
            <p className="mt-4 leading-7">{factualSummary(bike)} Podrobnejši opis bo dodan, ko ga vpiše EL-MOTO.</p>
          )}
          {equipment.length ? (
            <>
              <h3 className="display mt-8 text-3xl">Oprema</h3>
              <ul className="mt-3 list-disc pl-5 leading-7">
                {equipment.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : null}
          {bike.serviceHistory ? (
            <>
              <h3 className="display mt-8 text-3xl">Servisna zgodovina</h3>
              <p className="prose-copy mt-3">{bike.serviceHistory}</p>
            </>
          ) : (
            <p className="mt-6 text-sm leading-6 text-ink/60">Servisna zgodovina je navedena samo, če jo je podjetje dokumentiralo pri tem vozilu.</p>
          )}
          {bike.specifications.length ? (
            <>
              <h3 className="display mt-8 text-3xl">Dodatni podatki</h3>
              <dl className="mt-3 grid gap-2">
                {bike.specifications.map((spec) => (
                  <div key={spec.id} className="grid grid-cols-1 gap-1 border-b border-black/10 py-2 sm:grid-cols-2">
                    <dt>{spec.label}</dt>
                    <dd>{spec.value}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : null}
          {bike.source ? <SourceNote source={bike.source} checkedAt={bike.sourceCheckedAt} /> : null}
        </section>

        {!sold ? (
          <section id="povprasevanje" className="mt-12 max-w-2xl scroll-mt-24 bg-white p-4 sm:p-6">
            <h2 className="display text-4xl">Povpraševanje</h2>
            <p className="mt-2 mb-5 text-sm leading-6 text-ink/70">Obrazec je izpolnjen za ta motor. Oddaja ni potrditev nakupa.</p>
            <ContactForm
              initialType="PURCHASE"
              initialMotorcycleId={bike.id}
              motorcycles={choices.map((item) => ({ id: item.id, label: displayName(item) }))}
            />
          </section>
        ) : null}

        {related.length ? (
          <section className="mt-14">
            <h2 className="display text-4xl">Podobni motorji</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {related.map((item) => (
                <MotoCard key={item.id} bike={item} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
      <div className="dock fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-ink p-3 md:hidden">
        <div className="grid grid-cols-2 gap-2">
          <a className="btn btn-primary" href={`tel:${settings.phoneTel}`}>Pokliči</a>
          {sold ? (
            <Link className="btn btn-light" href="/motorji">Drugi motorji</Link>
          ) : (
            <a className="btn btn-light" href="#povprasevanje">Povpraševanje</a>
          )}
        </div>
      </div>
    </article>
  );
}

function SourceNote({ source, checkedAt }: { source: string; checkedAt: Date | null }) {
  const parts = source.split(/\s+/).filter(Boolean);
  const urls = parts.filter((part) => part.startsWith("http"));
  const rest = parts.filter((part) => !part.startsWith("http")).join(" ");
  return (
    <p className="mt-6 text-sm leading-6 text-ink/50">
      Vir podatkov:{" "}
      {urls.length
        ? urls.map((url, index) => (
            <span key={url}>{index > 0 ? ", " : null}<a className="underline" href={url} target="_blank" rel="noreferrer">{index === 0 ? "objava na Instagramu" : "druga objava"}</a></span>
          ))
        : source}
      {rest ? ` ${rest}` : ""}
      {checkedAt ? `, preverjeno ${checkedAt.toLocaleDateString("sl-SI")}.` : "."}
    </p>
  );
}
