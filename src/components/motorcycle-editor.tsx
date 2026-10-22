"use client";

import { useActionState } from "react";
import { saveMotorcycle, type ActionState } from "@/lib/actions/admin";

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
  engineType: string;
  transmission: string;
  driveType: string;
  color: string;
  licenseCategory: string;
  category: string;
  condition: string;
  status: string;
  forSale: boolean;
  forRent: boolean;
  priceCents: number | null;
  priceConfirmed: boolean;
  description: string;
  equipment: string;
  serviceHistory: string;
  featured: boolean;
  featuredOrder: number;
  seoTitle: string;
  seoDescription: string;
  source: string;
  sourceCheckedAt: string;
  specs: string;
};

export function MotorcycleEditor({ bike }: { bike?: Bike }) {
  const [state, action, pending] = useActionState(saveMotorcycle, null as ActionState);
  const price = bike?.priceCents && bike.priceCents > 0 ? String(bike.priceCents / 100) : "";
  return (
    <form action={action} className="grid gap-4">
      <h1 className="display text-5xl">{bike ? "Uredi motor" : "Nov motor"}</h1>
      {state?.error ? <p className="text-accent">{state.error}</p> : null}
      {bike ? <input type="hidden" name="id" value={bike.id} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field name="brand" label="Znamka" defaultValue={bike?.brand} required />
        <Field name="model" label="Model" defaultValue={bike?.model} required />
        <Field name="variant" label="Različica" defaultValue={bike?.variant} />
        <Field name="year" label="Letnik" type="number" defaultValue={bike?.year} required />
        <Field name="mileageKm" label="Kilometri" type="number" defaultValue={bike?.mileageKm ?? ""} />
        <Field name="engineCc" label="Prostornina ccm" type="number" defaultValue={bike?.engineCc ?? ""} />
        <Field name="powerKw" label="Moč kW" defaultValue={bike?.powerKw ?? ""} />
        <Field name="powerHp" label="Moč KM" defaultValue={bike?.powerHp ?? ""} />
        <Field name="engineType" label="Tip motorja" defaultValue={bike?.engineType} />
        <Field name="transmission" label="Menjalnik" defaultValue={bike?.transmission} />
        <Field name="driveType" label="Tip pogona" defaultValue={bike?.driveType} />
        <Field name="color" label="Barva" defaultValue={bike?.color} />
        <Field name="licenseCategory" label="Kategorija dovoljenja" defaultValue={bike?.licenseCategory} />
        <Field name="category" label="Kategorija" defaultValue={bike?.category} />
        <label className="field dark-fields">
          <span>Stanje</span>
          <select name="condition" defaultValue={bike?.condition || "USED"}>
            <option value="USED">Rabljeno</option>
            <option value="NEW">Novo</option>
          </select>
        </label>
        <label className="field dark-fields">
          <span>Status</span>
          <select name="status" defaultValue={bike?.status || "AVAILABLE"}>
            <option value="AVAILABLE">Na voljo</option>
            <option value="RESERVED">Rezervirano</option>
            <option value="SOLD">Prodano</option>
            <option value="HIDDEN">Skrito</option>
            <option value="ARCHIVED">Arhivirano</option>
          </select>
        </label>
        <Field name="priceEur" label="Cena EUR, prazno ali 0 pomeni povpraševanje" defaultValue={price} />
        <Field name="slug" label="Naslov URL, pustite prazno za samodejnega" defaultValue={bike?.slug} />
        <Field name="source" label="Vir podatkov" defaultValue={bike?.source} />
        <Field name="sourceCheckedAt" label="Datum preverjanja" type="date" defaultValue={bike?.sourceCheckedAt} />
        <Field name="featuredOrder" label="Vrstni red izpostavitve" type="number" defaultValue={bike?.featuredOrder ?? 0} />
        <Field name="seoTitle" label="SEO naslov" defaultValue={bike?.seoTitle} />
        <Field name="seoDescription" label="SEO opis" defaultValue={bike?.seoDescription} />
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2"><input type="checkbox" name="forSale" defaultChecked={bike?.forSale ?? true} className="h-5 w-5" /> Za prodajo</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="forRent" defaultChecked={bike?.forRent ?? false} className="h-5 w-5" /> Za najem</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="priceConfirmed" defaultChecked={bike?.priceConfirmed ?? false} className="h-5 w-5" /> Cena je potrjena</label>
        <label className="flex items-center gap-2"><input type="checkbox" name="featured" defaultChecked={bike?.featured ?? false} className="h-5 w-5" /> Izpostavi na prvi strani</label>
      </div>
      <Area name="description" label="Opis" defaultValue={bike?.description} />
      <Area name="equipment" label="Oprema, vsaka v svoji vrstici" defaultValue={bike?.equipment} />
      <Area name="serviceHistory" label="Servisna zgodovina, samo če je dokumentirana" defaultValue={bike?.serviceHistory} />
      <Area name="specs" label="Dodatne specifikacije, oblika Oznaka: vrednost" defaultValue={bike?.specs} />
      <button className="btn btn-primary w-full sm:w-auto" disabled={pending}>{pending ? "Shranjujem..." : "Shrani motor"}</button>
    </form>
  );
}

function Field({ name, label, defaultValue, type = "text", required = false }: { name: string; label: string; defaultValue?: string | number | null; type?: string; required?: boolean }) {
  return (
    <label className="field dark-fields">
      <span>{label}</span>
      <input name={name} type={type} defaultValue={defaultValue ?? ""} required={required} />
    </label>
  );
}

function Area({ name, label, defaultValue }: { name: string; label: string; defaultValue?: string }) {
  return (
    <label className="field dark-fields">
      <span>{label}</span>
      <textarea name={name} defaultValue={defaultValue || ""} />
    </label>
  );
}
