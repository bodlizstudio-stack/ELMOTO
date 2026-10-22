import { notFound } from "next/navigation";
import { updateInquiry } from "@/lib/actions/admin";
import { prisma } from "@/lib/db";
import { inquiryStatuses } from "@/lib/site";
import { formatLjubljana } from "@/lib/time";
import { displayName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InquiryPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ saved?: string }> }) {
  const { id } = await params;
  const query = await searchParams;
  const item = await prisma.inquiry.findUnique({ where: { id }, include: { motorcycle: true, events: { orderBy: { createdAt: "desc" } } } });
  if (!item) notFound();
  return (
    <section className="grid gap-4">
      <h1 className="display text-5xl">{item.name}</h1>
      {query.saved ? <p className="text-accent">Shranjeno.</p> : null}
      <p>{item.email}<br />{item.phone || "Telefon ni naveden"}</p>
      <p>{item.motorcycle ? displayName(item.motorcycle) : "Ni vezano na motor"}</p>
      <p className="text-sm text-muted">{formatLjubljana(item.createdAt)}</p>
      <p className="whitespace-pre-wrap bg-panel p-4">{item.message}</p>
      <form action={updateInquiry} className="grid gap-3">
        <input type="hidden" name="id" value={item.id} />
        <label className="field dark-fields">
          <span>Status</span>
          <select name="status" defaultValue={item.status}>
            {inquiryStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
          </select>
        </label>
        <label className="field dark-fields">
          <span>Interne opombe</span>
          <textarea name="internalNotes" defaultValue={item.internalNotes} />
        </label>
        <button className="btn btn-primary w-full sm:w-auto">Shrani</button>
      </form>
      <h2 className="display text-3xl">Zgodovina</h2>
      <ul className="grid gap-2 text-sm text-muted">
        {item.events.map((event) => <li key={event.id}>{formatLjubljana(event.createdAt)} · {event.action} {event.note}</li>)}
      </ul>
    </section>
  );
}
