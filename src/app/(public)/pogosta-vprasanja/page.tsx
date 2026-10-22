import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { FaqList } from "@/components/faq-list";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pogosta vprašanja",
  description: "Odgovori o nakupu, ogledu in najemu motorjev pri EL-MOTO v Trzinu.",
  alternates: { canonical: "/pogosta-vprasanja" },
};

export default async function FaqPage() {
  const items = await prisma.faqItem.findMany({ where: { published: true }, orderBy: [{ category: "asc" }, { sortOrder: "asc" }] });
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
  return (
    <section className="bg-paper py-8 text-ink sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="wrap max-w-3xl">
        <Breadcrumbs items={[{ href: "/", label: "Domov" }, { label: "Pogosta vprašanja" }]} />
        <h1 className="display mt-4 text-5xl sm:text-7xl">Pogosta vprašanja</h1>
        <div className="mt-8">
          {items.length ? <FaqList items={items} /> : <p>Vprašanja bodo objavljena, ko jih potrdi administrator.</p>}
        </div>
      </div>
    </section>
  );
}
