import { CookieBanner } from "@/components/cookie-banner";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getSettings } from "@/lib/settings";
import { site, siteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: site.brand,
    description: "Prodaja in najem motornih koles v Trzinu.",
    url: siteUrl(),
    telephone: settings.phoneTel,
    email: settings.email,
    image: `${siteUrl()}/logo.png`,
    address: {
      "@type": "PostalAddress",
      streetAddress: site.street,
      postalCode: site.postalCode,
      addressLocality: site.city,
      addressCountry: site.countryCode,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: site.lat,
      longitude: site.lng,
    },
    sameAs: [settings.instagram],
    areaServed: ["Trzin", "Ljubljana", "Slovenija"],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SiteHeader />
      <CookieBanner />
      <main id="vsebina">{children}</main>
      <SiteFooter
        phone={settings.phoneDisplay}
        email={settings.email}
        instagram={settings.instagram}
        hours={settings.hours}
        newsletter={settings.newsletterEnabled}
      />
    </>
  );
}
