"use server";

import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { mailConfigured, sendMail } from "@/lib/mail";
import { rateLimit } from "@/lib/rate-limit";
import { contactSchema, fieldErrors, readForm, rentalSchema, subscriberSchema } from "@/lib/validators";
import { findOverlap } from "@/lib/availability";
import { quoteCents, rentalDays, selectRate } from "@/lib/rental";
import { parseInTimeZone } from "@/lib/time";
import { displayName } from "@/lib/utils";
import { site } from "@/lib/site";

export type FormState = {
  ok: boolean;
  message?: string;
  errors?: Record<string, string>;
} | null;

async function limit(prefix: string) {
  const headerList = await headers();
  const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || headerList.get("x-real-ip") || "local";
  return rateLimit(`${prefix}:${ip}`);
}

export async function submitInquiry(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await limit("inquiry"))) {
    return { ok: false, message: "Preveč poskusov. Počakajte nekaj minut in poskusite znova." };
  }
  const parsed = contactSchema.safeParse(readForm(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const data = parsed.data;
  if (data.website) return { ok: false, message: "Pošiljanje ni uspelo." };

  const motorcycle = data.motorcycleId
    ? await prisma.motorcycle.findFirst({
        where: { id: data.motorcycleId, status: { notIn: ["HIDDEN", "ARCHIVED", "SOLD"] } },
      })
    : null;

  try {
    const inquiry = await prisma.inquiry.create({
      data: {
        kind: "CONTACT",
        type: data.type,
        name: data.name,
        email: data.email,
        phone: data.phone || "",
        motorcycleId: motorcycle?.id,
        message: data.message,
        privacyAccepted: true,
        events: { create: { action: "CREATED", note: "Povpraševanje je bilo oddano." } },
      },
    });
    const settings = await getSettings();
    const bikeName = motorcycle ? displayName(motorcycle) : "ni vezano na motor";
    const text = [
      "Novo povpraševanje na spletni strani EL-MOTO.",
      `Številka: ${inquiry.id}`,
      `Ime: ${data.name}`,
      `E-pošta: ${data.email}`,
      `Telefon: ${data.phone || "ni naveden"}`,
      `Vrsta: ${data.type}`,
      `Motor: ${bikeName}`,
      "",
      data.message,
    ].join("\n");
    const companyMail = await sendMail({
      to: settings.notifyEmail,
      subject: `Novo povpraševanje: ${data.name}`,
      text,
    });
    const visitorMail = await sendMail({
      to: data.email,
      subject: "Prejeli smo vaše povpraševanje | EL-MOTO",
      text: `Pozdravljeni ${data.name},\n\nvaše povpraševanje je shranjeno. To še ni potrditev nakupa, ogleda ali najema. Odgovorili vam bomo na navedeni kontakt.\n\nEL-MOTO\n${site.street}, ${site.postalCode} ${site.city}\n${settings.phoneDisplay}`,
    });
    const mailed = companyMail.sent || visitorMail.sent;
    return {
      ok: true,
      message: mailed
        ? "Povpraševanje je shranjeno. Potrdilo smo poslali na vaš e-poštni naslov, če je poštni servis sporočilo sprejel."
        : mailConfigured()
          ? "Povpraševanje je shranjeno. E-poštno obvestilo tokrat ni bilo poslano, zato vas bomo kontaktirali na podlagi shranjenega obrazca."
          : "Povpraševanje je shranjeno. E-poštno obvestilo še ni vklopljeno, zato vas bomo kontaktirali na podlagi shranjenega obrazca.",
    };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Povpraševanja ni bilo mogoče shraniti. Poskusite znova ali nas pokličite." };
  }
}

export async function submitRental(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await limit("rental"))) {
    return { ok: false, message: "Preveč poskusov. Počakajte nekaj minut in poskusite znova." };
  }
  const parsed = rentalSchema.safeParse(readForm(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  const data = parsed.data;
  if (data.website) return { ok: false, message: "Pošiljanje ni uspelo." };

  const bike = await prisma.motorcycle.findFirst({
    where: { id: data.motorcycleId, forRent: true, status: "AVAILABLE" },
    include: { rentalRates: true },
  });
  if (!bike) return { ok: false, message: "Izbrani motor trenutno ni na voljo za najem." };

  let pickup: Date;
  let ret: Date;
  try {
    pickup = parseInTimeZone(data.pickupDate, data.pickupTime);
    ret = parseInTimeZone(data.returnDate, data.returnTime);
  } catch {
    return { ok: false, message: "Datum ali ura ni veljavna." };
  }
  if (pickup.getTime() < Date.now() - 5 * 60 * 1000) {
    return { ok: false, message: "Prevzem ne more biti v preteklosti." };
  }
  const days = rentalDays(pickup, ret);
  if (days <= 0) return { ok: false, message: "Vračilo mora biti po prevzemu." };
  if (days > 90) return { ok: false, message: "V eno povpraševanje lahko vključite največ 90 dni." };

  const overlap = await findOverlap(bike.id, pickup, ret);
  if (overlap) {
    return { ok: false, message: "Izbrani termin ni na voljo. Izberite drug datum ali nas pokličite." };
  }

  const quote = quoteCents(pickup, days, selectRate(bike.rentalRates, pickup));
  try {
    const booking = await prisma.rentalBooking.create({
      data: {
        motorcycleId: bike.id,
        name: data.name,
        email: data.email,
        phone: data.phone,
        licenseCategory: data.licenseCategory,
        message: data.message || "",
        pickupAt: pickup,
        returnAt: ret,
        days,
        quotedCents: quote,
        status: "NEW",
        termsAccepted: true,
        privacyAccepted: true,
        events: { create: { action: "CREATED", note: "Oddano povpraševanje, še ni potrjeno." } },
      },
    });
    const settings = await getSettings();
    const text = [
      "Novo povpraševanje za najem.",
      `Številka: ${booking.id}`,
      `Motor: ${displayName(bike)}`,
      `Stranka: ${data.name}`,
      `E-pošta: ${data.email}`,
      `Telefon: ${data.phone}`,
      `Dovoljenje: ${data.licenseCategory}`,
      `Prevzem: ${data.pickupDate} ${data.pickupTime}`,
      `Vračilo: ${data.returnDate} ${data.returnTime}`,
      `Dni: ${days}`,
      `Okvirna cena: ${quote == null ? "ni potrjena" : `${quote / 100} EUR`}`,
      "",
      data.message || "",
      "",
      "Povpraševanje ni potrjena rezervacija.",
    ].join("\n");
    await sendMail({ to: settings.notifyEmail, subject: `Najem: ${displayName(bike)}`, text });
    const visitor = await sendMail({
      to: data.email,
      subject: "Prejeli smo povpraševanje za najem | EL-MOTO",
      text: `Pozdravljeni ${data.name},\n\npovpraševanje za najem motorja ${displayName(bike)} je shranjeno. Rezervacija je potrjena šele, ko jo potrdi EL-MOTO.\n\n${site.street}, ${site.postalCode} ${site.city}\n${settings.phoneDisplay}`,
    });
    return {
      ok: true,
      message: visitor.sent
        ? "Povpraševanje je shranjeno in potrdilo je poslano na vaš e-poštni naslov. Rezervacija začne veljati šele po potrditvi EL-MOTO."
        : "Povpraševanje je shranjeno. Rezervacija začne veljati šele po potrditvi EL-MOTO. E-poštno potrdilo bo poslano, ko bo poštni servis nastavljen.",
    };
  } catch (error) {
    console.error(error);
    return { ok: false, message: "Povpraševanja ni bilo mogoče shraniti. Poskusite znova ali nas pokličite." };
  }
}

export async function subscribe(_prev: FormState, formData: FormData): Promise<FormState> {
  if (!(await limit("subscribe"))) return { ok: false, message: "Preveč poskusov. Počakajte in poskusite znova." };
  const settings = await getSettings();
  if (!settings.newsletterEnabled) return { ok: false, message: "Obvestila trenutno niso vklopljena." };
  const parsed = subscriberSchema.safeParse(readForm(formData));
  if (!parsed.success) return { ok: false, errors: fieldErrors(parsed.error) };
  if (parsed.data.website) return { ok: false, message: "Prijava ni uspela." };
  const existing = await prisma.subscriber.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (existing) return { ok: true, message: "Ta naslov je že prijavljen." };
  await prisma.subscriber.create({ data: { email: parsed.data.email.toLowerCase(), consent: true } });
  const mailed = await sendMail({
    to: parsed.data.email,
    subject: "Prijava na obvestila EL-MOTO",
    text: "Vaša prijava na obvestila o ponudbi EL-MOTO je shranjena. Od obvestil se lahko odjavite z odgovorom na to sporočilo ali s sporočilom na info@elmoto.si.",
  });
  return {
    ok: true,
    message: mailed.sent
      ? "Prijava je shranjena. Potrdilo smo poslali na vaš e-poštni naslov."
      : "Prijava je shranjena. Obvestila bomo začeli pošiljati, ko bo e-poštna storitev vklopljena.",
  };
}
