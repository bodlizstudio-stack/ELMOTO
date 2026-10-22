import { createBlock, createManualBooking, deleteBlock, saveRate, updateBooking } from "@/lib/actions/admin";
import { prisma } from "@/lib/db";
import { bookingStatuses } from "@/lib/site";
import { formatLjubljana } from "@/lib/time";
import { displayName, formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminRental({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string; month?: string }> }) {
  const query = await searchParams;
  const cursor = query.month ? new Date(`${query.month}-01T12:00:00`) : new Date();
  const [bikes, bookings, blocks] = await Promise.all([
    prisma.motorcycle.findMany({ where: { forRent: true }, include: { rentalRates: true }, orderBy: { brand: "asc" } }),
    prisma.rentalBooking.findMany({ include: { motorcycle: true, events: { orderBy: { createdAt: "desc" } } }, orderBy: { createdAt: "desc" } }),
    prisma.rentalBlock.findMany({ include: { motorcycle: true }, orderBy: { startAt: "asc" } }),
  ]);
  const days = Array.from({ length: new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate() }, (_, index) => index + 1);
  const monthLabel = new Intl.DateTimeFormat("sl-SI", { month: "long", year: "numeric" }).format(cursor);
  const previous = new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1);
  const nextDate = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  const stamp = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  const prev = stamp(previous);
  const next = stamp(nextDate);

  return (
    <section className="grid gap-8">
      <h1 className="display text-5xl">Najem</h1>
      {query.saved ? <p className="text-accent">Shranjeno.</p> : null}
      {query.error === "prekrivanje" ? <p className="text-accent">Termin se prekriva s potrjeno rezervacijo ali blokado.</p> : null}
      {query.error === "datum" ? <p className="text-accent">Datum ni veljaven.</p> : null}
      {query.error === "cena" ? <p className="text-accent">Cena ni veljavna. 0 EUR se ne shrani kot cena.</p> : null}

      <div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="display text-3xl capitalize">{monthLabel}</h2>
          <div className="flex gap-2">
            <a className="btn btn-line" href={`/admin/najem?month=${prev}`}>Prejšnji</a>
            <a className="btn btn-line" href={`/admin/najem?month=${next}`}>Naslednji</a>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1 text-center text-xs">
          {days.map((day) => {
            const dayStart = new Date(cursor.getFullYear(), cursor.getMonth(), day);
            const dayEnd = new Date(cursor.getFullYear(), cursor.getMonth(), day + 1);
            const busy = bookings.some((booking) => booking.status === "CONFIRMED" && booking.pickupAt < dayEnd && booking.returnAt > dayStart)
              || blocks.some((block) => block.startAt < dayEnd && block.endAt > dayStart);
            return <div key={day} className={`grid h-11 place-items-center ${busy ? "bg-accent text-white" : "bg-panel"}`}>{day}</div>;
          })}
        </div>
        <p className="mt-2 text-sm text-muted">Označeni dnevi imajo potrjeno rezervacijo ali blokado. Podrobnosti so v seznamu.</p>
      </div>

      <div className="grid gap-3">
        <h2 className="display text-3xl">Rezervacije in zgodovina</h2>
        {bookings.map((booking) => (
          <article key={booking.id} className="grid gap-3 bg-panel p-4">
            <div>
              <h3>{displayName(booking.motorcycle)} · {booking.name}</h3>
              <p className="text-sm text-muted">{booking.email} · {booking.phone} · {booking.licenseCategory}</p>
              <p className="text-sm">{formatLjubljana(booking.pickupAt)} – {formatLjubljana(booking.returnAt)} · {booking.days} dni</p>
              <p className="text-sm">{booking.quotedCents ? formatPrice(booking.quotedCents, true) : "Cena na povpraševanje"}</p>
              {booking.message ? <p className="mt-2 text-sm">{booking.message}</p> : null}
            </div>
            <form action={updateBooking} className="grid gap-3">
              <input type="hidden" name="id" value={booking.id} />
              <label className="field dark-fields">
                <span>Status</span>
                <select name="status" defaultValue={booking.status}>
                  {bookingStatuses.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}
                </select>
              </label>
              <label className="field dark-fields">
                <span>Interne opombe</span>
                <textarea name="internalNotes" defaultValue={booking.internalNotes} />
              </label>
              <button className="btn btn-primary w-full sm:w-auto">Shrani</button>
            </form>
            {booking.events.length ? (
              <ul className="text-xs text-muted">
                {booking.events.map((event) => <li key={event.id}>{formatLjubljana(event.createdAt)} · {event.action} {event.note}</li>)}
              </ul>
            ) : null}
          </article>
        ))}
        {!bookings.length ? <p className="text-muted">Rezervacij še ni.</p> : null}
      </div>

      <form action={createManualBooking} className="grid gap-3 bg-panel p-4">
        <h2 className="display text-3xl">Obstoječa rezervacija</h2>
        <BikeSelect bikes={bikes} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Text name="name" label="Ime" />
          <Text name="phone" label="Telefon" />
          <Text name="pickupDate" label="Prevzem" type="date" />
          <Text name="pickupTime" label="Ura" type="time" />
          <Text name="returnDate" label="Vračilo" type="date" />
          <Text name="returnTime" label="Ura vračila" type="time" />
        </div>
        <button className="btn btn-primary w-full sm:w-auto">Vnesi potrjeno rezervacijo</button>
      </form>

      <form action={createBlock} className="grid gap-3 bg-panel p-4">
        <h2 className="display text-3xl">Blokada termina</h2>
        <BikeSelect bikes={bikes} />
        <div className="grid gap-3 sm:grid-cols-2">
          <Text name="startDate" label="Od" type="date" />
          <Text name="startTime" label="Ura" type="time" />
          <Text name="endDate" label="Do" type="date" />
          <Text name="endTime" label="Ura" type="time" />
        </div>
        <Text name="reason" label="Razlog" />
        <button className="btn btn-primary w-full sm:w-auto">Blokiraj</button>
      </form>
      <div className="grid gap-2">
        {blocks.map((block) => (
          <form key={block.id} action={deleteBlock} className="flex flex-wrap items-center justify-between gap-3 bg-panel p-3 text-sm">
            <input type="hidden" name="id" value={block.id} />
            <span>{displayName(block.motorcycle)} · {formatLjubljana(block.startAt)} – {formatLjubljana(block.endAt)} · {block.reason}</span>
            <button className="underline">Odstrani</button>
          </form>
        ))}
      </div>

      <div className="grid gap-4">
        <h2 className="display text-3xl">Ceniki</h2>
        <p className="text-sm text-muted">Zneskov ne izmišljamo. Cena je javna šele, ko označite, da je potrjena, in vnesete znesek večji od 0.</p>
        {bikes.map((bike) => (
          <form key={bike.id} action={saveRate} className="grid gap-3 bg-panel p-4">
            <h3>{displayName(bike)}</h3>
            <input type="hidden" name="motorcycleId" value={bike.id} />
            <input type="hidden" name="rateId" value={bike.rentalRates[0]?.id || ""} />
            <div className="grid gap-3 sm:grid-cols-2">
              <Text name="dailyEur" label="Dnevna cena EUR" defaultValue={cents(bike.rentalRates[0]?.dailyCents)} />
              <Text name="weekendEur" label="Vikend cena EUR" defaultValue={cents(bike.rentalRates[0]?.weekendCents)} />
              <Text name="multidayEur" label="Cena na dan od 3. dne" defaultValue={cents(bike.rentalRates[0]?.multidayCents)} />
              <Text name="extraKmEur" label="Dodatni km EUR" defaultValue={cents(bike.rentalRates[0]?.extraKmCents)} />
              <Text name="depositEur" label="Varščina EUR" defaultValue={cents(bike.rentalRates[0]?.depositCents)} />
              <Text name="kmLimitPerDay" label="Km na dan" defaultValue={bike.rentalRates[0]?.kmLimitPerDay ?? ""} />
              <Text name="seasonStart" label="Sezona od MM-DD" defaultValue={bike.rentalRates[0]?.seasonStart} />
              <Text name="seasonEnd" label="Sezona do MM-DD" defaultValue={bike.rentalRates[0]?.seasonEnd} />
            </div>
            <label className="field dark-fields">
              <span>Dodatna oprema in opomba</span>
              <textarea name="extrasNote" defaultValue={bike.rentalRates[0]?.extrasNote || ""} />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="confirmed" defaultChecked={bike.rentalRates[0]?.confirmed} className="h-5 w-5" />
              Cenik je potrjen in se sme prikazati
            </label>
            <button className="btn btn-primary w-full sm:w-auto">Shrani cenik</button>
          </form>
        ))}
        {!bikes.length ? <p className="text-muted">Najprej pri motorju označite, da je na voljo za najem.</p> : null}
      </div>
    </section>
  );
}

function cents(value?: number | null) {
  return value && value > 0 ? String(value / 100) : "";
}

function BikeSelect({ bikes }: { bikes: { id: string; brand: string; model: string; variant: string }[] }) {
  return (
    <label className="field dark-fields">
      <span>Motor</span>
      <select name="motorcycleId" required>
        {bikes.map((bike) => <option key={bike.id} value={bike.id}>{displayName(bike)}</option>)}
      </select>
    </label>
  );
}

function Text({ name, label, type = "text", defaultValue = "" }: { name: string; label: string; type?: string; defaultValue?: string | number }) {
  return (
    <label className="field dark-fields">
      <span>{label}</span>
      <input name={name} type={type} defaultValue={defaultValue} />
    </label>
  );
}
