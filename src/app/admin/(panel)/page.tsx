import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatLjubljana } from "@/lib/time";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const [published, available, sold, rental, newInquiries, openRentals, confirmed, logs] = await Promise.all([
    prisma.motorcycle.count({ where: { status: { in: ["AVAILABLE", "RESERVED", "SOLD"] }, forSale: true } }),
    prisma.motorcycle.count({ where: { status: "AVAILABLE", forSale: true } }),
    prisma.motorcycle.count({ where: { status: "SOLD" } }),
    prisma.motorcycle.count({ where: { forRent: true, status: "AVAILABLE" } }),
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.rentalBooking.count({ where: { status: { in: ["NEW", "IN_PROGRESS"] } } }),
    prisma.rentalBooking.count({ where: { status: "CONFIRMED" } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 8, include: { user: true } }),
  ]);
  const cards = [
    ["Objavljeni motorji", published],
    ["Na voljo", available],
    ["Prodani", sold],
    ["Za najem", rental],
    ["Nova povpraševanja", newInquiries],
    ["Odprti najemi", openRentals],
    ["Potrjene rezervacije", confirmed],
  ];
  return (
    <section>
      <h1 className="display text-5xl">Pregled</h1>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(([label, value]) => (
          <article key={String(label)} className="bg-panel p-4">
            <p className="text-sm text-muted">{label}</p>
            <p className="display mt-2 text-5xl">{value}</p>
          </article>
        ))}
      </div>
      <h2 className="display mt-10 text-3xl">Nedavne aktivnosti</h2>
      <ul className="mt-4 grid gap-2">
        {logs.length ? logs.map((log) => (
          <li key={log.id} className="bg-panel px-4 py-3 text-sm">
            {formatLjubljana(log.createdAt)} · {log.action} · {log.entity} {log.detail}
          </li>
        )) : <li className="text-muted">Aktivnosti še ni.</li>}
      </ul>
      <Link className="btn btn-primary mt-6" href="/admin/motorji/nov">Dodaj motor</Link>
    </section>
  );
}
