"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { COMPARE_LIMIT, compareKey, readCompare, writeCompare } from "@/components/compare-button";
import { conditionLabel, formatCc, formatKm, formatPower, formatPrice, statusLabel } from "@/lib/utils";

type Bike = {
  id: string;
  slug: string;
  brand: string;
  model: string;
  variant: string;
  year: number;
  mileageKm: number | null;
  engineCc: number | null;
  powerKw: number | null;
  powerHp: number | null;
  transmission: string;
  driveType: string;
  color: string;
  licenseCategory: string;
  category: string;
  condition: string;
  status: string;
  priceCents: number | null;
  priceConfirmed: boolean;
  image: string | null;
};

export function SavedBikes({ title, empty }: { title: string; empty: string }) {
  const key = compareKey();
  const [bikes, setBikes] = useState<Bike[] | null>(null);

  useEffect(() => {
    let controller = new AbortController();
    const load = () => {
      controller.abort();
      controller = new AbortController();
      const ids = readCompare().slice(0, COMPARE_LIMIT);
      if (!ids.length) {
        setBikes([]);
        return;
      }
      fetch(`/api/motorji?ids=${ids.join(",")}`, { signal: controller.signal })
        .then((response) => response.json())
        .then((data: Bike[]) => {
          const order = new Map(ids.map((id, index) => [id, index]));
          setBikes([...data].sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0)).slice(0, COMPARE_LIMIT));
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") return;
          setBikes([]);
        });
    };
    load();
    window.addEventListener("elmoto-compare", load);
    return () => {
      controller.abort();
      window.removeEventListener("elmoto-compare", load);
    };
  }, [key]);

  return (
    <section className="bg-paper py-8 text-ink sm:py-12">
      <div className="wrap">
        <h1 className="display text-5xl sm:text-7xl">{title}</h1>
        {bikes == null ? <div className="mt-8 h-40 animate-pulse bg-white" /> : null}
        {bikes && bikes.length ? (
          <p className="mt-3 text-sm text-ink/60">V primerjavi: {Math.min(bikes.length, COMPARE_LIMIT)} od {COMPARE_LIMIT} motorjev.</p>
        ) : null}
        {bikes?.length === 0 ? <p className="mt-6 max-w-xl leading-7">{empty}</p> : null}
        {bikes && bikes.length ? <CompareTable bikes={bikes} /> : null}
      </div>
    </section>
  );
}

function CompareTable({ bikes }: { bikes: Bike[] }) {
  const rows: [string, (bike: Bike) => string][] = [
    ["Cena", (bike) => formatPrice(bike.priceCents, bike.priceConfirmed)],
    ["Letnik", (bike) => String(bike.year)],
    ["Stanje", (bike) => conditionLabel(bike.condition) || "ni navedeno"],
    ["Zaloga", (bike) => statusLabel(bike.status)],
    ["Kilometri", (bike) => formatKm(bike.mileageKm) || "ni navedeno"],
    ["Prostornina", (bike) => formatCc(bike.engineCc) || "ni navedeno"],
    ["Moč", (bike) => formatPower(bike.powerKw, bike.powerHp) || "ni navedeno"],
    ["Menjalnik", (bike) => bike.transmission || "ni navedeno"],
    ["Pogon", (bike) => bike.driveType || "ni navedeno"],
    ["Barva", (bike) => bike.color || "ni navedeno"],
    ["Dovoljenje", (bike) => bike.licenseCategory || "ni navedeno"],
    ["Kategorija", (bike) => bike.category || "ni navedeno"],
  ];
  return (
    <div className="mt-8 overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse bg-white text-sm">
        <thead>
          <tr>
            <th className="p-3 text-left">Podatek</th>
            {bikes.map((bike) => (
              <th key={bike.id} className="p-3 text-left">
                <Link className="underline" href={`/motorji/${bike.slug}`}>
                  {bike.brand} {bike.model} {bike.variant}
                </Link>
                <button
                  type="button"
                  className="mt-2 block text-xs uppercase tracking-[0.12em] text-ink/60 underline"
                  onClick={() => writeCompare(readCompare().filter((item) => item !== bike.id))}
                >
                  Odstrani
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-t border-black/10">
              <th className="p-3 text-left font-medium">{label}</th>
              {bikes.map((bike) => (
                <td key={bike.id} className="p-3">
                  {value(bike)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
