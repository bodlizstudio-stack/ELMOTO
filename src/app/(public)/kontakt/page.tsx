import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ContactForm } from "@/components/contact-form";
import { LocationMap } from "@/components/location-map";
import { publicChoices } from "@/lib/motorcycles";
import { getSettings } from "@/lib/settings";
import { site } from "@/lib/site";
import { displayName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stopi v stik z nami",
  description: "Kontakt EL-MOTO v Trzinu. Špruha 33, telefon +386 70 868 600, info@elmoto.si. Povpraševanje za nakup ali najem motorja.",
  alternates: { canonical: "/kontakt" },
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ motor?: string; vrsta?: string }>;
}) {
  const params = await searchParams;
  const [settings, choices] = await Promise.all([getSettings(), publicChoices()]);
  const selected = choices.find((bike) => bike.id === params.motor);
  return (
    <section className="bg-paper py-8 text-ink sm:py-12">
      <div className="wrap">
        <Breadcrumbs items={[{ href: "/", label: "Domov" }, { label: "Kontakt" }]} />
        <h1 className="display mt-4 text-5xl sm:text-7xl">Stopi v stik z nami</h1>
        <p className="mt-4 max-w-2xl leading-7">Pišite, pokličite ali se oglasite po dogovoru. Odgovorimo na povpraševanja, ki so shranjena prek obrazca.</p>
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(16rem,0.8fr)_minmax(0,1.2fr)]">
          <div className="grid content-start gap-4">
            <p className="display text-4xl">{site.brand}</p>
            <p>
              {site.street}
              <br />
              {site.postalCode} {site.city}
              <br />
              {site.country}
            </p>
            <a className="text-lg underline" href={`tel:${settings.phoneTel}`}>
              {settings.phoneDisplay}
            </a>
            <a className="break-all underline" href={`mailto:${settings.email}`}>
              {settings.email}
            </a>
            <a className="underline" href={settings.instagram} target="_blank" rel="noreferrer">
              Instagram {site.instagramHandle}
            </a>
            {settings.hours ? <p>Delovni čas: {settings.hours}</p> : <p className="text-sm text-ink/60">Delovni čas bo objavljen, ko ga potrdi podjetje.</p>}
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <a className="btn btn-dark" href={`tel:${settings.phoneTel}`}>Pokliči nas</a>
              <a className="btn btn-dark" href={`mailto:${settings.email}`}>Pošlji e-pošto</a>
              <a className="btn btn-dark" href="https://www.google.com/maps/dir/?api=1&destination=%C5%A0pruha+33%2C+1236+Trzin%2C+Slovenija" target="_blank" rel="noreferrer">Odpri navigacijo</a>
              <a className="btn btn-line btn-ink" href={settings.instagram} target="_blank" rel="noreferrer">Instagram</a>
            </div>
          </div>
          <div>
            <ContactForm
              initialType={params.vrsta || (selected ? "PURCHASE" : "GENERAL")}
              initialMotorcycleId={selected?.id || ""}
              motorcycles={choices.map((bike) => ({ id: bike.id, label: displayName(bike) }))}
            />
            <LocationMap />
          </div>
        </div>
      </div>
    </section>
  );
}
