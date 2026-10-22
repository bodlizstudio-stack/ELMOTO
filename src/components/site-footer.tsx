import Link from "next/link";
import { LogoLink } from "@/components/logo";
import { site } from "@/lib/site";
import { CookieSettingsButton } from "@/components/cookie-banner";
import { SubscribeForm } from "@/components/subscribe-form";

export function SiteFooter({
  phone,
  email,
  instagram,
  hours,
  newsletter,
}: {
  phone: string;
  email: string;
  instagram: string;
  hours: string;
  newsletter: boolean;
}) {
  const tel = phone.replace(/[^\d+]/g, "");
  return (
    <footer className="border-t border-white/10 bg-ink text-white">
      <div className="wrap grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <LogoLink className="h-10 w-auto sm:h-12" />
          <p className="mt-3 max-w-md text-muted">{site.slogan}</p>
          <p className="mt-4 text-sm leading-6">
            {site.street}
            <br />
            {site.postalCode} {site.city}, {site.country}
          </p>
          {hours ? <p className="mt-3 text-sm text-muted">Delovni čas: {hours}</p> : null}
        </div>
        <div className="grid content-start gap-2 text-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Strani</p>
          <Link href="/motorji">Motorji za prodajo</Link>
          <Link href="/najem">Najem motorjev</Link>
          <Link href="/o-nas">O nas</Link>
          <Link href="/pogosta-vprasanja">Pogosta vprašanja</Link>
          <Link href="/kontakt">Kontakt</Link>
          <Link href="/primerjava">Primerjava</Link>
        </div>
        <div className="grid content-start gap-2 text-sm">
          <p className="text-xs uppercase tracking-[0.16em] text-muted">Kontakt</p>
          <a href={`tel:${tel}`}>{phone}</a>
          <a className="break-all" href={`mailto:${email}`}>
            {email}
          </a>
          <a href={instagram} target="_blank" rel="noreferrer">
            Instagram @elmoto.si
          </a>
          <Link href="/zasebnost">Politika zasebnosti</Link>
          <Link href="/piskotki">Piškotki</Link>
          <Link href="/pogoji">Pogoji poslovanja</Link>
          <Link href="/pogoji-najema">Pogoji najema</Link>
          <Link href="/podjetje">Podatki o podjetju</Link>
          <CookieSettingsButton />
        </div>
      </div>
      {newsletter ? (
        <div className="wrap pb-8">
          <SubscribeForm />
        </div>
      ) : null}
      <div className="border-t border-white/10 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} {site.brand}. Vse pravice pridržane.
      </div>
    </footer>
  );
}
