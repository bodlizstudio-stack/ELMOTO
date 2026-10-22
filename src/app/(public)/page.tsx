import Link from "next/link";
import { Compass, MessageSquare, Search, ShieldCheck } from "lucide-react";
import { Photo } from "@/components/photo";
import { MotoCard } from "@/components/moto-card";
import { Reveal } from "@/components/reveal";
import { prisma } from "@/lib/db";
import { homeBikes } from "@/lib/motorcycles";
import { getSettings } from "@/lib/settings";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

const reasons = [
  { icon: MessageSquare, title: "Osebno svetovanje", text: "Pri izbiri motorja se pogovorimo o tem, kako in kje ga boste vozili." },
  { icon: Search, title: "Jasne informacije", text: "Pri vsakem motorju so navedeni podatki, ki so vneseni za to vozilo." },
  { icon: Compass, title: "Različni slogi vožnje", text: "V ponudbi so motorji za različne namene, od vsakodnevne vožnje do daljših poti." },
  { icon: ShieldCheck, title: "Nakup ali najem", text: "Motor lahko kupite ali pošljete povpraševanje za najem, brez spletnega plačila." },
];

const steps = [
  ["01", "Preglej ponudbo."],
  ["02", "Izberi motor, ki te zanima."],
  ["03", "Pošlji povpraševanje in se dogovori za ogled."],
  ["04", "Dogovori se za nakup in prevzem."],
];

export default async function HomePage() {
  const [{ featured, newest }, settings, sale, rent, stories, instagram, testimonials] = await Promise.all([
    homeBikes(),
    getSettings(),
    prisma.mediaAsset.findFirst({ where: { kind: "sale", published: true }, orderBy: { sortOrder: "asc" } }),
    prisma.mediaAsset.findFirst({ where: { kind: "rent", published: true }, orderBy: { sortOrder: "asc" } }),
    prisma.mediaAsset.findMany({ where: { kind: "story", published: true }, orderBy: { sortOrder: "asc" }, take: 4 }),
    prisma.mediaAsset.findMany({ where: { kind: "instagram", published: true }, orderBy: { sortOrder: "asc" }, take: 12 }),
    prisma.testimonial.findMany({ where: { published: true }, orderBy: { createdAt: "desc" }, take: 6 }),
  ]);

  return (
    <>
      <section className="relative flex min-h-[calc(100dvh-4rem)] items-end overflow-hidden bg-ink">
        <Photo src="/images/hero-ozadje.png" alt="" priority sizes="100vw" className="object-[center_62%]" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink via-ink/20 to-transparent" />
        <div className="wrap relative z-10 pb-[calc(2.5rem+var(--cookie-space))] pt-16 text-white sm:pt-28">
          <p className="hero-rise text-xs uppercase tracking-[0.28em] text-brand">{site.slogan}</p>
          <h1 className="hero-rise display mt-4 max-w-5xl text-[clamp(3.1rem,12vw,7.4rem)]">
            Tvoja pot.
            <br />
            Tvoj motor.
          </h1>
          <p className="hero-rise-delay mt-6 max-w-xl text-base leading-7 text-white/85 sm:text-lg">
            Odkrij skrbno izbrano ponudbo motornih koles za nakup ali najem. Pri EL-MOTO se vsaka dobra zgodba začne na dveh kolesih.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="btn btn-primary w-full sm:w-auto" href="/motorji">
              Razišči motorje
            </Link>
            <Link className="btn btn-line w-full sm:w-auto" href="/najem">
              Najemi motor
            </Link>
          </div>
        </div>
        <a href="#ponudba" className="scroll-cue absolute hidden text-xs uppercase tracking-[0.2em] text-white/70 sm:block">
          Pomakni navzdol
        </a>
      </section>

      <section id="ponudba" className="bg-paper py-16 text-ink">
        <div className="wrap">
          <Reveal>
            <p className="text-xs uppercase tracking-[0.22em] text-brand">Ponudba</p>
            <h2 className="display mt-2 text-5xl sm:text-6xl">Izbrani motorji iz naše ponudbe</h2>
          </Reveal>
          {featured.length ? (
            <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {featured.map((bike) => (
                <MotoCard key={bike.id} bike={bike} />
              ))}
            </div>
          ) : (
            <div className="mt-8 border border-black/10 bg-white p-6">
              <p className="text-lg leading-7">Trenutno ni objavljenih motorjev. Pokličite nas ali pošljite povpraševanje in preverite razpoložljivost.</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <a className="btn btn-dark w-full sm:w-auto" href={`tel:${settings.phoneTel}`}>
                  Pokliči {settings.phoneDisplay}
                </a>
                <Link className="btn btn-dark w-full sm:w-auto" href="/kontakt">
                  Pošlji povpraševanje
                </Link>
              </div>
            </div>
          )}
          <Link className="btn btn-dark mt-8 w-full sm:w-auto" href="/motorji">
            Poglej vse motorje
          </Link>
          {newest.length ? (
            <div className="mt-14">
              <h3 className="display text-4xl">Najnovejši motorji</h3>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {newest.map((bike) => (
                  <MotoCard key={bike.id} bike={bike} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-3 bg-ink p-3 lg:grid-cols-2">
        <Split href={sale?.linkUrl?.startsWith("/") ? sale.linkUrl : "/motorji"} title="Prodaja motorjev" text="Poišči motor, ki ustreza tvojemu slogu vožnje." cta="Motorji za prodajo" image={sale?.url} alt={sale?.alt || "Prodaja motorjev"} caption={sale?.alt} />
        <Split href="/najem" title="Najem motorjev" text="Doživi svobodo na dveh kolesih brez dolgoročne obveznosti." cta="Preveri najem" image={rent?.url} alt={rent?.alt || "Najem motorjev"} />
      </section>

      {stories.length ? (
        <section className="bg-ink pb-16">
          <div className="wrap">
            <h2 className="display text-5xl sm:text-6xl">Iz salona</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {stories.map((photo) => (
                <Link key={photo.id} href={photo.linkUrl || "/motorji"} className="group overflow-hidden rounded-2xl bg-panel">
                  <span className="relative block aspect-[4/3] overflow-hidden">
                    <Photo src={photo.url} alt={photo.alt || "Motor EL-MOTO"} sizes="(min-width: 768px) 45vw, 100vw" />
                  </span>
                  <span className="block px-4 py-4 text-base leading-6 text-white/90">{photo.alt}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-paper py-16 text-ink">
        <div className="wrap">
          <h2 className="display text-5xl sm:text-6xl">Zakaj EL-MOTO?</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {reasons.map((reason) => (
              <article key={reason.title} className="rounded-2xl border border-black/10 bg-white p-5">
                <reason.icon aria-hidden className="text-brand" />
                <h3 className="display mt-4 text-3xl">{reason.title}</h3>
                <p className="mt-2 leading-7 text-ink/70">{reason.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-ink py-16">
        <div className="wrap">
          <h2 className="display text-5xl sm:text-6xl">Kako poteka nakup?</h2>
          <ol className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {steps.map(([number, label]) => (
              <li key={number} className="rounded-2xl border border-white/10 bg-panel p-5">
                <span className="display text-5xl text-brand">{number}</span>
                <p className="mt-4 text-lg leading-7">{label}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-paper py-16 text-ink">
        <div className="wrap">
          <h2 className="display text-5xl sm:text-6xl">EL-MOTO na Instagramu</h2>
          <p className="mt-3 max-w-2xl leading-7 text-ink/70">
            Manjša izbira javnih objav s profila {site.instagramHandle}. Vsaka fotografija vodi na izvirno objavo.
          </p>
          <a className="mt-4 inline-flex text-lg underline" href={settings.instagram} target="_blank" rel="noreferrer">
            {site.instagramHandle}
          </a>
          {instagram.length ? (
            <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {instagram.map((photo) => (
                <a key={photo.id} href={photo.linkUrl || settings.instagram} target="_blank" rel="noreferrer" className="ig-tile group overflow-hidden rounded-2xl border border-black/10 bg-white">
                  <span className="relative block aspect-square overflow-hidden">
                    <Photo src={photo.url} alt={photo.alt || "Fotografija EL-MOTO"} sizes="(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw" />
                  </span>
                  <span className="block px-3 py-3 text-sm leading-5 text-ink/80">{photo.alt}</span>
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {testimonials.length ? (
        <section className="bg-white py-16 text-ink">
          <div className="wrap">
            <h2 className="display text-5xl">Ocene strank</h2>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {testimonials.map((item) => (
                <blockquote key={item.id} className="border border-black/10 p-5">
                  <p className="leading-7">“{item.text}”</p>
                  <footer className="mt-4 text-sm text-ink/60">
                    {item.authorName}
                    {item.rating ? ` · ${item.rating}/5` : ""}
                    {item.source ? ` · ${item.source}` : ""}
                  </footer>
                </blockquote>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="bg-panel py-16">
        <div className="wrap">
          <h2 className="display text-5xl sm:text-7xl">Pripravljen na naslednjo vožnjo?</h2>
          <p className="mt-4 max-w-xl text-lg leading-7 text-muted">Poišči svoj naslednji motor ali nas kontaktiraj za pomoč pri izbiri.</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link className="btn btn-primary w-full sm:w-auto" href="/motorji">
              Oglej si motorje
            </Link>
            <Link className="btn btn-line w-full sm:w-auto" href="/kontakt">
              Kontaktiraj nas
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function Split({ href, title, text, cta, image, alt, caption }: { href: string; title: string; text: string; cta: string; image?: string; alt: string; caption?: string }) {
  return (
    <Link href={href} className="split-link group relative flex min-h-[24rem] items-end overflow-hidden rounded-2xl bg-panel p-6 sm:p-10">
      {image ? (
        <span className="absolute inset-0">
          <Photo src={image} alt={alt} sizes="(min-width: 1024px) 50vw, 100vw" />
        </span>
      ) : (
        <span className="split-fallback absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(142,173,212,0.28),transparent_42%),radial-gradient(circle_at_82%_80%,rgba(236,35,54,0.22),transparent_40%),linear-gradient(160deg,#171a1f,#0b0d10)]" />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-transparent" />
      <span className="relative">
        {caption ? <span className="mb-3 block text-xs uppercase tracking-[0.18em] text-brand">{caption}</span> : null}
        <span className="display block text-5xl sm:text-6xl">{title}</span>
        <span className="mt-3 block max-w-md text-lg leading-7 text-white/85">{text}</span>
        <span className="btn btn-primary mt-6">{cta}</span>
      </span>
    </Link>
  );
}
