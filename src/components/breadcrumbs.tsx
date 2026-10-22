import Link from "next/link";

export function Breadcrumbs({ items }: { items: { href?: string; label: string }[] }) {
  const json = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      ...(item.href ? { item: item.href } : {}),
    })),
  };
  return (
    <nav aria-label="Drobtince" className="text-sm text-ink/60">
      <ol className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <li key={item.label} className="flex gap-2">
            {item.href ? <Link className="underline" href={item.href}>{item.label}</Link> : <span aria-current="page">{item.label}</span>}
            {index < items.length - 1 ? <span aria-hidden>/</span> : null}
          </li>
        ))}
      </ol>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }} />
    </nav>
  );
}
