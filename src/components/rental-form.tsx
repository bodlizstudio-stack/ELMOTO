"use client";

import { useActionState, useMemo, useState } from "react";
import { submitRental, type FormState } from "@/lib/actions/public";
import { quoteCents, rangesOverlap, rentalDays, selectRate, type RateInput } from "@/lib/rental";
import { parseInTimeZone } from "@/lib/time";
import { formatPrice } from "@/lib/utils";
import { fieldErrors, rentalSchema } from "@/lib/validators";

const licenses = ["A", "A2", "A1", "B", "AM", "Drugo"];

export function RentalForm({
  motorcycles,
  initialMotorcycleId,
  rates,
  blocks,
  termsConfirmed,
}: {
  motorcycles: { id: string; label: string }[];
  initialMotorcycleId: string;
  rates: RateInput[];
  blocks: { start: string; end: string }[];
  termsConfirmed: boolean;
}) {
  const [state, action, pending] = useActionState(submitRental, null as FormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("09:00");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("18:00");
  const shown = { ...errors, ...state?.errors };

  const preview = useMemo(() => {
    try {
      if (!pickupDate || !returnDate) return null;
      const pickup = parseInTimeZone(pickupDate, pickupTime || "09:00");
      const ret = parseInTimeZone(returnDate, returnTime || "18:00");
      const days = rentalDays(pickup, ret);
      if (days <= 0) return { error: "Vračilo mora biti po prevzemu." };
      const overlap = blocks.some((block) => rangesOverlap(pickup, ret, new Date(block.start), new Date(block.end)));
      const quote = quoteCents(pickup, days, selectRate(rates, pickup));
      return { days, quote, overlap };
    } catch {
      return null;
    }
  }, [blocks, pickupDate, pickupTime, rates, returnDate, returnTime]);

  if (state?.ok) {
    return (
      <div className="border border-black/10 bg-white p-5 text-ink" role="status">
        <h2 className="display text-4xl">Povpraševanje je oddano</h2>
        <p className="mt-3 leading-7">{state.message}</p>
      </div>
    );
  }

  return (
    <form
      action={action}
      className="grid gap-4"
      noValidate
      onSubmit={(event) => {
        const parsed = rentalSchema.safeParse(Object.fromEntries(new FormData(event.currentTarget)));
        if (!parsed.success) {
          event.preventDefault();
          setErrors(fieldErrors(parsed.error));
        } else setErrors({});
      }}
    >
      <div className="absolute -left-[9999px] h-0 overflow-hidden" aria-hidden="true">
        <input name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <p className="border border-accent/40 bg-accent/10 p-3 text-sm leading-6 text-ink">
        Oddaja obrazca je povpraševanje. Rezervacija je potrjena šele, ko jo potrdi EL-MOTO. Spletno plačilo ni vključeno.
      </p>
      <label className="field">
        <span>Ime in priimek</span>
        <input name="name" autoComplete="name" required />
        {shown.name ? <em className="text-sm not-italic text-accent">{shown.name}</em> : null}
      </label>
      <label className="field">
        <span>E-pošta</span>
        <input name="email" type="email" autoComplete="email" required />
        {shown.email ? <em className="text-sm not-italic text-accent">{shown.email}</em> : null}
      </label>
      <label className="field">
        <span>Telefon</span>
        <input name="phone" type="tel" autoComplete="tel" inputMode="tel" required />
        {shown.phone ? <em className="text-sm not-italic text-accent">{shown.phone}</em> : null}
      </label>
      <label className="field">
        <span>Motor</span>
        <select name="motorcycleId" defaultValue={initialMotorcycleId} required>
          {motorcycles.map((bike) => (
            <option key={bike.id} value={bike.id}>
              {bike.label}
            </option>
          ))}
        </select>
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="field">
          <span>Datum prevzema</span>
          <input name="pickupDate" type="date" required value={pickupDate} onChange={(event) => setPickupDate(event.target.value)} />
        </label>
        <label className="field">
          <span>Ura prevzema</span>
          <input name="pickupTime" type="time" required value={pickupTime} onChange={(event) => setPickupTime(event.target.value)} />
        </label>
        <label className="field">
          <span>Datum vračila</span>
          <input name="returnDate" type="date" required value={returnDate} onChange={(event) => setReturnDate(event.target.value)} />
        </label>
        <label className="field">
          <span>Ura vračila</span>
          <input name="returnTime" type="time" required value={returnTime} onChange={(event) => setReturnTime(event.target.value)} />
        </label>
      </div>
      {preview && "error" in preview ? <p className="text-sm text-accent">{preview.error}</p> : null}
      {preview && "days" in preview ? (
        <div className="bg-ink p-4 text-white">
          <p>Število dni najema: {preview.days}</p>
          <p className="mt-1">{preview.quote == null ? "Cena na povpraševanje" : `Okvirni izračun: ${formatPrice(preview.quote, true)}`}</p>
          {preview.overlap ? <p className="mt-2 text-accent">Ta termin se prekriva z nedostopnostjo. Izberite drug datum.</p> : null}
        </div>
      ) : null}
      <label className="field">
        <span>Kategorija vozniškega dovoljenja</span>
        <select name="licenseCategory" defaultValue="">
          <option value="" disabled>
            Izberite
          </option>
          {licenses.map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>
        {shown.licenseCategory ? <em className="text-sm not-italic text-accent">{shown.licenseCategory}</em> : null}
      </label>
      <label className="field">
        <span>Dodatno sporočilo</span>
        <textarea name="message" />
      </label>
      <label className="flex items-start gap-3 text-sm leading-6 text-ink/80">
        <input name="terms" type="checkbox" className="mt-1 h-5 w-5 min-h-5" required />
        <span>
          {termsConfirmed
            ? "Seznanjen sem s pogoji najema in razumem, da povpraševanje še ni potrjena rezervacija."
            : "Seznanjen sem, da uradni pogoji najema še niso potrjeni in da oddaja obrazca ni potrjena rezervacija."}{" "}
          <a className="underline" href="/pogoji-najema">
            Pogoji najema
          </a>
        </span>
      </label>
      <label className="flex items-start gap-3 text-sm leading-6 text-ink/80">
        <input name="privacy" type="checkbox" className="mt-1 h-5 w-5 min-h-5" required />
        <span>
          Seznanjen sem s <a className="underline" href="/zasebnost">politiko zasebnosti</a>.
        </span>
      </label>
      {state?.message ? <p className="text-sm text-accent">{state.message}</p> : null}
      <button className="btn btn-primary w-full sm:w-auto" disabled={pending || Boolean(preview && "overlap" in preview && preview.overlap)}>
        {pending ? "Pošiljanje..." : "Pošlji povpraševanje"}
      </button>
    </form>
  );
}
