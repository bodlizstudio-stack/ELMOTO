import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { getPage } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function LegalDocument({
  slug,
  description,
}: {
  slug: string;
  description: string;
}) {
  const page = await getPage(slug);
  if (!page) notFound();
  return (
    <section className="bg-paper py-8 text-ink sm:py-12">
      <div className="wrap max-w-3xl">
        <Breadcrumbs items={[{ href: "/", label: "Domov" }, { label: page.title }]} />
        {!page.confirmed ? (
          <p className="mt-6 border border-accent bg-white p-4 leading-7">
            Osnutek. Besedilo mora pred javno objavo pregledati odgovorna oseba. Do potrditve ne velja kot uradni dokument podjetja.
          </p>
        ) : null}
        <h1 className="display mt-6 text-5xl sm:text-6xl">{page.title}</h1>
        <p className="sr-only">{description}</p>
        <div className="prose-copy mt-6">{page.body}</div>
      </div>
    </section>
  );
}

export function legalMetadata(title: string, description: string, path: string): Metadata {
  return { title, description, alternates: { canonical: path } };
}
