import Link from "next/link";
import { prisma } from "@/lib/db";
import { inquiryStatuses, inquiryTypes } from "@/lib/site";
import { formatLjubljana } from "@/lib/time";
import { displayName } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function InquiriesPage() {
  const items = await prisma.inquiry.findMany({ include: { motorcycle: true }, orderBy: { createdAt: "desc" } });
  return (
    <section>
      <h1 className="display text-5xl">Povpraševanja</h1>
      <div className="mt-6 grid gap-3">
        {items.map((item) => (
          <Link key={item.id} href={`/admin/povprasevanja/${item.id}`} className="grid gap-1 bg-panel p-4">
            <span className="text-lg">{item.name}</span>
            <span className="text-sm text-muted">{item.email} · {item.phone || "brez telefona"}</span>
            <span className="text-sm">{inquiryTypes.find((type) => type.value === item.type)?.label} · {inquiryStatuses.find((status) => status.value === item.status)?.label}</span>
            <span className="text-sm">{item.motorcycle ? displayName(item.motorcycle) : "ni vezano na motor"} · {formatLjubljana(item.createdAt)}</span>
          </Link>
        ))}
        {!items.length ? <p className="text-muted">Povpraševanj še ni.</p> : null}
      </div>
    </section>
  );
}
